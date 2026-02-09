import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Body, Box, ContactMaterial, ConvexPolyhedron, Material, Plane, Vec3, World } from 'cannon-es';
import './PhysicsDice.scss';

type PhysicsDiceProps = {
    diceSides?: number[];
    diceCount?: number;
    rollKey?: number;
    collisionSoundUrl?: string;
    collisionSoundUrls?: string[];
    collisionVolume?: number;
    diceColor?: string;
    diceRoughness?: number;
    diceMetalness?: number;
    diceColors?: string[];
    diceRoughnesses?: number[];
    diceMetalnesses?: number[];
    keyLightPosition?: { x: number; y: number; z: number };
    keyLightTarget?: { x: number; y: number; z: number };
    ambientLightColor?: string;
    ambientLightIntensity?: number;
    keyLightColor?: string;
    keyLightIntensity?: number;
    fillLightColor?: string;
    fillLightIntensity?: number;
    highlightTextColor?: string;
    textColor?: string;
    highlightTextColors?: string[];
    textColors?: string[];
    thumbnailCanvases?: Array<HTMLCanvasElement | null>;
    rollingResults?: number[];
    tableHalfSize?: number;
    tableWallHeight?: number;
    tableCeilingHeight?: number;
    orbitSpeed?: number;
    results?: number[];
    autoRollOnSetup?: boolean;
    onResults?: (results: number[]) => void;
    onRollingResults?: (results: number[]) => void;
};

type DiceInstance = {
    mesh: THREE.Mesh;
    body: Body;
    faces: FaceNormal[];
    collideHandler?: (event: { contact?: { getImpactVelocityAlongNormal: () => number } }) => void;
    soundUrl?: string;
    facePlates?: THREE.Mesh[];
    faceOffsets?: number[];
    radius: number;
    sides: number;
    d4VertexValues?: number[];
    thumbnail?: {
        canvas: HTMLCanvasElement;
        renderer: THREE.WebGLRenderer;
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        mesh: THREE.Mesh;
        light: THREE.DirectionalLight;
        ambient: THREE.AmbientLight;
    };
    rollingResult?: number;
};

type DiceDefinition = {
    geometry: THREE.BufferGeometry;
    shape: Box | ConvexPolyhedron;
    faces: FaceNormal[];
    materials: THREE.Material[];
    faceOffsets: number[];
    radius: number;
    collisionScale?: number;
};

type FaceNormal = {
    normal: Vec3;
    value: number;
};

const D6_FACE_NORMALS: FaceNormal[] = [
    { normal: new Vec3(1, 0, 0), value: 3 },
    { normal: new Vec3(-1, 0, 0), value: 4 },
    { normal: new Vec3(0, 1, 0), value: 1 },
    { normal: new Vec3(0, -1, 0), value: 6 },
    { normal: new Vec3(0, 0, 1), value: 2 },
    { normal: new Vec3(0, 0, -1), value: 5 },
];

type FaceTexture = {
    texture: THREE.CanvasTexture;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    value: number;
    sides: number;
    lastColor: string;
};

const updateFaceTextureColor = (faceTexture: FaceTexture, color: string) => {
    if (faceTexture.lastColor === color) return;
    const { canvas, ctx, value, sides } = faceTexture;
    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = color;
    const label = String(value);
    let fontSize = sides >= 20 ? 110 : sides >= 12 ? 120 : sides >= 10 ? 128 : 140;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${fontSize}px Arial`;

    const maxWidth = size * 0.72;
    while (ctx.measureText(label).width > maxWidth && fontSize > 64) {
        fontSize -= 6;
        ctx.font = `bold ${fontSize}px Arial`;
    }

    ctx.fillText(label, size / 2, size / 2);
    faceTexture.texture.needsUpdate = true;
    faceTexture.lastColor = color;
};

const createFaceTexture = (value: number, sides: number) => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return {
            texture: new THREE.CanvasTexture(canvas),
            canvas,
            ctx: ctx as unknown as CanvasRenderingContext2D,
            value,
            sides,
            lastColor: '',
        };
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 8;
    const faceTexture: FaceTexture = {
        texture,
        canvas,
        ctx,
        value,
        sides,
        lastColor: '',
    };
    updateFaceTextureColor(faceTexture, '#000000');
    return faceTexture;
};


type DiceMaterialOptions = {
    color: string;
    roughness: number;
    metalness: number;
};

const createDiceMaterials = (values: number[], sides: number, options: DiceMaterialOptions) =>
    values.map(
        (value) =>
            new THREE.MeshStandardMaterial({
                color: options.color,
                roughness: options.roughness,
                metalness: options.metalness,
            })
    );

const computeFaceOffsets = (geometry: THREE.BufferGeometry, faces: FaceNormal[]) => {
    const buffer = geometry.index ? geometry : geometry.toNonIndexed();
    const position = buffer.attributes.position;
    const offsets = faces.map((face) => {
        let maxDot = -Infinity;
        for (let i = 0; i < position.count; i += 1) {
            const dot =
                face.normal.x * position.getX(i) +
                face.normal.y * position.getY(i) +
                face.normal.z * position.getZ(i);
            if (dot > maxDot) maxDot = dot;
        }
        return maxDot;
    });
    return offsets;
};

const getTopFaceValue = (body: Body, faces: FaceNormal[]) => {
    let maxY = -Infinity;
    let topValue = 1;
    faces.forEach(({ normal, value }) => {
        const worldNormal = body.quaternion.vmult(normal);
        if (worldNormal.y > maxY) {
            maxY = worldNormal.y;
            topValue = value;
        }
    });
    return topValue;
};

const getTopDieValue = (die: DiceInstance) => {
    const primaryShape = die.body.shapes[0];
    if (die.sides === 4 && die.d4VertexValues && primaryShape instanceof ConvexPolyhedron) {
        let maxY = -Infinity;
        let topValue = 1;
        primaryShape.vertices.forEach((vertex: Vec3, index: number) => {
            const worldPos = die.body.quaternion.vmult(vertex).vadd(die.body.position);
            if (worldPos.y > maxY) {
                maxY = worldPos.y;
                topValue = die.d4VertexValues?.[index] ?? topValue;
            }
        });
        return topValue;
    }

    return getTopFaceValue(die.body, die.faces);
};

const HIGHLIGHT_COLOR = new THREE.Color('#f7d070');
const BASE_PLATE_COLOR = new THREE.Color('#ffffff');
const BASE_TEXT_COLOR = new THREE.Color('#000000');
const HIGHLIGHT_TEXT_COLOR = new THREE.Color('#800080');

const buildConvexFromGeometry = (geometry: THREE.BufferGeometry) => {
    const buffer = geometry.index ? geometry : geometry.toNonIndexed();
    const position = buffer.attributes.position;
    const index = buffer.index
        ? Array.from(buffer.index.array as Iterable<number>)
        : Array.from({ length: position.count }, (_, i) => i);

    const vertices: Vec3[] = [];
    for (let i = 0; i < position.count; i += 1) {
        vertices.push(new Vec3(position.getX(i), position.getY(i), position.getZ(i)));
    }

    const faces: number[][] = [];
    const normals: Vec3[] = [];

    for (let i = 0; i < index.length; i += 3) {
        const a = vertices[index[i]];
        const b = vertices[index[i + 1]];
        const c = vertices[index[i + 2]];
        const normal = b.vsub(a).cross(c.vsub(a));
        normal.normalize();
        faces.push([index[i], index[i + 1], index[i + 2]]);
        normals.push(normal);
    }

    buffer.computeBoundingSphere();
    const radius = buffer.boundingSphere?.radius ?? 0.5;
    return { vertices, faces, triangleNormals: normals, geometry: buffer, radius };
};

const clusterFaceNormals = (triangleNormals: Vec3[]) => {
    const clusters: { normal: Vec3; triangles: number[] }[] = [];
    const triangleToCluster: number[] = [];

    triangleNormals.forEach((normal, index) => {
        let clusterIndex = clusters.findIndex((cluster) => cluster.normal.dot(normal) > 0.999);
        if (clusterIndex === -1) {
            clusterIndex = clusters.length;
            clusters.push({ normal: normal.clone(), triangles: [] });
        }
        clusters[clusterIndex].triangles.push(index);
        triangleToCluster[index] = clusterIndex;
    });

    return { clusters, triangleToCluster };
};

const applyFaceGroups = (geometry: THREE.BufferGeometry, triangleToCluster: number[]) => {
    geometry.clearGroups();
    for (let i = 0; i < triangleToCluster.length; i += 1) {
        geometry.addGroup(i * 3, 3, triangleToCluster[i]);
    }
};

const createPolyhedronDice = (
    geometry: THREE.BufferGeometry,
    sides: number,
    materialOptions: DiceMaterialOptions,
    forceClusterCount?: number
) => {
    const { vertices, faces, triangleNormals, geometry: buffer, radius } = buildConvexFromGeometry(geometry);
    const { clusters, triangleToCluster } = clusterFaceNormals(triangleNormals);

    if (forceClusterCount && clusters.length !== forceClusterCount) {
        applyFaceGroups(buffer, triangleNormals.map((_, index) => index));
        const values = Array.from({ length: triangleNormals.length }, (_, i) => i + 1);
        const faceOffsets = computeFaceOffsets(buffer, triangleNormals.map((normal, i) => ({ normal, value: values[i] })));
        return {
            geometry: buffer,
            shape: new ConvexPolyhedron({ vertices, faces }),
            faces: triangleNormals.map((normal, i) => ({ normal, value: values[i] })),
            materials: createDiceMaterials(values, sides, materialOptions),
            faceOffsets,
            radius,
        };
    }

    applyFaceGroups(buffer, triangleToCluster);
    const values = clusters.map((_, index) => index + 1);
    const faceNormals: FaceNormal[] = clusters.map((cluster, index) => ({
        normal: cluster.normal,
        value: values[index],
    }));

    const faceOffsets = computeFaceOffsets(buffer, faceNormals);
    return {
        geometry: buffer,
        shape: new ConvexPolyhedron({ vertices, faces }),
        faces: faceNormals,
        materials: createDiceMaterials(values, sides, materialOptions),
        faceOffsets,
        radius,
    };
};

const createCustomPolyhedron = (
    vertices: Vec3[],
    faces: number[][],
    sides: number,
    materialOptions: DiceMaterialOptions
) => {
    const centroid = vertices.reduce((acc, vertex) => acc.vadd(vertex), new Vec3(0, 0, 0));
    centroid.scale(1 / Math.max(vertices.length, 1), centroid);

    const positions: number[] = [];
    const uvs: number[] = [];

    vertices.forEach((vertex) => {
        positions.push(vertex.x, vertex.y, vertex.z);
        const u = 0.5 + Math.atan2(vertex.z, vertex.x) / (2 * Math.PI);
        const v = 0.5 - Math.asin(Math.max(-1, Math.min(1, vertex.y))) / Math.PI;
        uvs.push(u, v);
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

    const correctedFaces: number[][] = [];
    const triangleNormals: Vec3[] = [];

    faces.forEach((face) => {
        const a = vertices[face[0]];
        const b = vertices[face[1]];
        const c = vertices[face[2]];
        const normal = b.vsub(a).cross(c.vsub(a));
        normal.normalize();
        const faceCenter = new Vec3(
            (a.x + b.x + c.x) / 3,
            (a.y + b.y + c.y) / 3,
            (a.z + b.z + c.z) / 3
        );
        const outward = faceCenter.vsub(centroid);

        if (normal.dot(outward) < 0) {
            correctedFaces.push([face[0], face[2], face[1]]);
            normal.scale(-1, normal);
        } else {
            correctedFaces.push([face[0], face[1], face[2]]);
        }

        triangleNormals.push(normal);
    });

    geometry.setIndex(correctedFaces.flat());
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    const radius = geometry.boundingSphere?.radius ?? 0.6;

    applyFaceGroups(geometry, triangleNormals.map((_, index) => index));
    const values = correctedFaces.map((_, index) => index + 1);

    const faceDefs = triangleNormals.map((normal, index) => ({ normal, value: values[index] }));
    const faceOffsets = computeFaceOffsets(geometry, faceDefs);
    return {
        geometry,
        shape: new ConvexPolyhedron({ vertices, faces: correctedFaces }),
        faces: faceDefs,
        materials: createDiceMaterials(values, sides, materialOptions),
        faceOffsets,
        radius,
    };
};

const createDiceDefinition = (sides: number, materialOptions: DiceMaterialOptions): DiceDefinition => {
    switch (sides) {
        case 4: {
            const geometry = new THREE.TetrahedronGeometry(0.78);
            const definition = createPolyhedronDice(geometry, sides, materialOptions, 4);
            return {
                ...definition,
                radius: definition.radius * 1.06,
                collisionScale: 0.95,
            };
        }
        case 6: {
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            geometry.computeBoundingSphere();
            const radius = geometry.boundingSphere?.radius ?? 0.5;
            const faceOffsets = computeFaceOffsets(geometry, D6_FACE_NORMALS);
            return {
                geometry,
                shape: new Box(new Vec3(0.5, 0.5, 0.5)),
                faces: D6_FACE_NORMALS,
                materials: createDiceMaterials([3, 4, 1, 6, 2, 5], sides, materialOptions),
                faceOffsets,
                radius,
            };
        }
        case 8: {
            const geometry = new THREE.OctahedronGeometry(0.7);
            return createPolyhedronDice(geometry, sides, materialOptions, 8);
        }
        case 10: {
            const top = new Vec3(0, 1, 0);
            const bottom = new Vec3(0, -1, 0);
            const radius = 0.85;
            const ring: Vec3[] = Array.from({ length: 5 }, (_, i) => {
                const angle = (i / 5) * Math.PI * 2;
                return new Vec3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
            });
            const vertices = [top, bottom, ...ring];
            const faces: number[][] = [];
            for (let i = 0; i < 5; i += 1) {
                const next = i === 4 ? 0 : i + 1;
                faces.push([0, 2 + i, 2 + next]);
                faces.push([1, 2 + next, 2 + i]);
            }
            const definition = createCustomPolyhedron(vertices, faces, sides, materialOptions);
            definition.materials.forEach((material) => {
                if (material instanceof THREE.MeshStandardMaterial) {
                    material.flatShading = true;
                    material.side = THREE.FrontSide;
                    material.needsUpdate = true;
                }
            });
            return definition;
        }
        case 12: {
            const geometry = new THREE.DodecahedronGeometry(0.7);
            return createPolyhedronDice(geometry, sides, materialOptions, 12);
        }
        case 20: {
            const geometry = new THREE.IcosahedronGeometry(0.75);
            return createPolyhedronDice(geometry, sides, materialOptions, 20);
        }
        default: {
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            geometry.computeBoundingSphere();
            const radius = geometry.boundingSphere?.radius ?? 0.5;
            const faceOffsets = computeFaceOffsets(geometry, D6_FACE_NORMALS);
            return {
                geometry,
                shape: new Box(new Vec3(0.5, 0.5, 0.5)),
                faces: D6_FACE_NORMALS,
                materials: createDiceMaterials([3, 4, 1, 6, 2, 5], 6, materialOptions),
                faceOffsets,
                radius,
            };
        }
    }
};

const PhysicsDice = ({
    diceSides,
    diceCount = 2,
    rollKey = 0,
    collisionSoundUrl,
    collisionSoundUrls,
    collisionVolume = 0.6,
    diceColor = '#ffffff',
    diceRoughness = 0.005,
    diceMetalness = 0.1,
    diceColors,
    diceRoughnesses,
    diceMetalnesses,
    keyLightPosition = { x: 6, y: 10, z: 4 },
    keyLightTarget = { x: 0, y: 0, z: 0 },
    ambientLightColor = '#ffffff',
    ambientLightIntensity = 0.85,
    keyLightColor = '#ffffff',
    keyLightIntensity = 1.45,
    fillLightColor = '#ffffff',
    fillLightIntensity = 0.75,
    highlightTextColor = '#800080',
    textColor = '#000000',
    highlightTextColors,
    textColors,
    thumbnailCanvases,
    tableHalfSize = 5.5,
    tableWallHeight = 2.5,
    tableCeilingHeight = 6,
    orbitSpeed = 0.12,
    results,
    autoRollOnSetup = true,
    onResults,
    onRollingResults,
}: PhysicsDiceProps) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const worldRef = useRef<World | null>(null);
    const diceRef = useRef<DiceInstance[]>([]);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
    const keyLightTargetRef = useRef<THREE.Object3D | null>(null);
    const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
    const fillLightRef = useRef<THREE.DirectionalLight | null>(null);
    const diceMaterialRef = useRef<Material | null>(null);
    const animationRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(performance.now());
    const settleFramesRef = useRef(0);
    const resultEmittedRef = useRef(false);
    const lastResultsRef = useRef<number[]>([]);
    const pulseActiveRef = useRef(false);
    const textColorRef = useRef(textColor);
    const highlightTextColorRef = useRef(highlightTextColor);
    const textColorsRef = useRef<string[] | undefined>(textColors);
    const highlightTextColorsRef = useRef<string[] | undefined>(highlightTextColors);
    const thumbnailCanvasesRef = useRef<Array<HTMLCanvasElement | null> | undefined>(thumbnailCanvases);
    const lastRollingUpdateRef = useRef(0);
    const prevSidesRef = useRef<number[]>([]);
    const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
    const audioPoolRef = useRef<Record<string, HTMLAudioElement[]>>({});
    const audioIndexRef = useRef(0);
    const lastSoundTimeRef = useRef(0);
    const audioPrimedRef = useRef(false);
    const boundsRef = useRef(new THREE.Box3());
    const boundsSphereRef = useRef(new THREE.Sphere());
    const cameraTargetRef = useRef(new THREE.Vector3());
    const cameraDesiredRef = useRef(new THREE.Vector3());
    const cameraDirRef = useRef(new THREE.Vector3(1, 0.9, 1));
    const tableCenterRef = useRef(new THREE.Vector3(0, 0, 0));
    const zoomOutRef = useRef(false);
    const initialCameraPosRef = useRef(new THREE.Vector3(6, 7.5, 9));
    const initialCameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));
    const orbitAngleRef = useRef(0);
    const zoomOutDirRef = useRef(new THREE.Vector3(1, 0.9, 1));
    const plateQuatRef = useRef(new THREE.Quaternion());

    const resolvedSides = useMemo(() => {
        if (diceSides && diceSides.length > 0) return diceSides;
        return Array.from({ length: diceCount }, () => 6);
    }, [diceSides, diceCount]);

    const clearDice = () => {
        if (!sceneRef.current || !worldRef.current) return;
        diceRef.current.forEach(({ mesh, body, collideHandler, facePlates, thumbnail }) => {
            sceneRef.current?.remove(mesh);
            facePlates?.forEach((plate) => {
                if (plate.material instanceof THREE.MeshBasicMaterial) {
                    plate.material.map?.dispose();
                    plate.material.dispose();
                }
            });
            if (collideHandler) body.removeEventListener('collide', collideHandler);
            worldRef.current?.removeBody(body);
            if (thumbnail) {
                thumbnail.renderer.dispose();
            }
            mesh.geometry.dispose();
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach((mat: THREE.Material) => mat.dispose());
            } else {
                mesh.material.dispose();
            }
        });
        diceRef.current = [];
    };

    const removeDieAt = (index: number) => {
        if (!sceneRef.current || !worldRef.current) return;
        const die = diceRef.current[index];
        if (!die) return;
        const { mesh, body, collideHandler, facePlates, thumbnail } = die;
        sceneRef.current?.remove(mesh);
        facePlates?.forEach((plate) => {
            if (plate.material instanceof THREE.MeshBasicMaterial) {
                plate.material.map?.dispose();
                plate.material.dispose();
            }
        });
        if (collideHandler) body.removeEventListener('collide', collideHandler);
        worldRef.current?.removeBody(body);
        if (thumbnail) {
            thumbnail.renderer.dispose();
        }
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat: THREE.Material) => mat.dispose());
        } else {
            mesh.material.dispose();
        }
        diceRef.current.splice(index, 1);
    };

    const playImpactSound = (impact: number, soundUrl?: string) => {
        if (!soundUrl) return;
        const pool = audioPoolRef.current[soundUrl];
        if (!pool || pool.length === 0) return;
        const now = performance.now();
        if (now - lastSoundTimeRef.current < 80) return;
        if (impact < 1.2) return;

        lastSoundTimeRef.current = now;
        const volume = Math.min(Math.max((impact / 12) * collisionVolume, 0), 1);
        const audio = pool[audioIndexRef.current % pool.length];
        audioIndexRef.current = (audioIndexRef.current + 1) % pool.length;
        audio.volume = volume;
        audio.currentTime = 0;
        void audio.play();
    };

    const getDieTextColor = (index: number) =>
        textColorsRef.current?.[index] ?? textColorRef.current;
    const getDieHighlightColor = (index: number) =>
        highlightTextColorsRef.current?.[index] ?? highlightTextColorRef.current;

    const setupThumbnail = (die: DiceInstance, canvas: HTMLCanvasElement | null) => {
        if (!canvas) {
            if (die.thumbnail) {
                die.thumbnail.renderer.dispose();
                die.thumbnail = undefined;
            }
            return;
        }

        if (die.thumbnail?.canvas === canvas) return;

        if (die.thumbnail) {
            die.thumbnail.renderer.dispose();
        }

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0x000000, 0);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
        const ambient = new THREE.AmbientLight('#ffffff', 0.6);
        const light = new THREE.DirectionalLight('#ffffff', 0.9);
        light.position.set(2.5, 4, 3);
        scene.add(ambient, light);

        const mesh = die.mesh.clone();
        mesh.position.set(0, 0, 0);
        mesh.quaternion.copy(die.mesh.quaternion);
        mesh.scale.copy(die.mesh.scale);
        scene.add(mesh);

        const distance = Math.max(die.radius * 2.4, 2.2);
        camera.position.set(distance, distance * 0.9, distance);
        camera.lookAt(0, 0, 0);

        die.thumbnail = { canvas, renderer, scene, camera, mesh, light, ambient };
    };

    const resetPlateHighlights = () => {
        diceRef.current.forEach((die, dieIndex) => {
            die.facePlates?.forEach((plate) => {
                if (plate.material instanceof THREE.MeshBasicMaterial) {
                    plate.material.color.copy(BASE_PLATE_COLOR);
                    plate.material.opacity = 1;
                }
                const faceTexture = plate.userData.faceTexture as FaceTexture | undefined;
                if (faceTexture) {
                    updateFaceTextureColor(faceTexture, new THREE.Color(getDieTextColor(dieIndex)).getStyle());
                }
            });

        });
    };

    const createDie = (sides: number, index: number, diceMaterial: Material, dropFromAbove: boolean) => {
        const resolvedColor = diceColors?.[index] ?? diceColor;
        const resolvedRoughness = diceRoughnesses?.[index] ?? diceRoughness;
        const resolvedMetalness = diceMetalnesses?.[index] ?? diceMetalness;
        const materialOptions: DiceMaterialOptions = {
            color: resolvedColor,
            roughness: resolvedRoughness,
            metalness: resolvedMetalness,
        };
        const { geometry, shape, faces, materials, radius, faceOffsets, collisionScale } = createDiceDefinition(
            sides,
            materialOptions
        );
        const mesh = new THREE.Mesh(geometry, materials);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.geometry.computeVertexNormals();
        mesh.position.set(
            (index - (resolvedSides.length - 1) / 2) * 1.6,
            dropFromAbove ? 3.5 + index * 0.2 : 1.2,
            (Math.random() - 0.5) * 1.6
        );
        sceneRef.current?.add(mesh);

        const facePlates: THREE.Mesh[] = [];
        const plateSize = radius * (sides === 4 ? 0.85 : 0.9);
        const plateGeometry = new THREE.PlaneGeometry(plateSize, plateSize);
        const bufferGeometry = geometry.index ? geometry : geometry.toNonIndexed();
        const positionAttr = bufferGeometry.attributes.position;
        const indexArray = bufferGeometry.index ? (bufferGeometry.index.array as ArrayLike<number>) : null;

        const d4VertexValues = (() => {
            if (sides !== 4) return undefined;
            const keyToUnique = new Map<string, number>();
            const uniquePositions: THREE.Vector3[] = [];
            const perIndexToUnique: number[] = [];

            for (let i = 0; i < positionAttr.count; i += 1) {
                const x = positionAttr.getX(i);
                const y = positionAttr.getY(i);
                const z = positionAttr.getZ(i);
                const key = `${x.toFixed(5)}|${y.toFixed(5)}|${z.toFixed(5)}`;
                let uniqueIndex = keyToUnique.get(key);
                if (uniqueIndex === undefined) {
                    uniqueIndex = uniquePositions.length;
                    keyToUnique.set(key, uniqueIndex);
                    uniquePositions.push(new THREE.Vector3(x, y, z));
                }
                perIndexToUnique[i] = uniqueIndex;
            }

            const sorted = uniquePositions
                .map((position, index) => ({ position, index }))
                .sort((a, b) =>
                    b.position.y - a.position.y || b.position.x - a.position.x || b.position.z - a.position.z
                );
            const uniqueValues = new Array(uniquePositions.length).fill(1);
            sorted.forEach((item, index) => {
                uniqueValues[item.index] = index + 1;
            });

            return perIndexToUnique.map((uniqueIndex) => uniqueValues[uniqueIndex] ?? 1);
        })();

        const getFaceVertices = (faceIndex: number) => {
            const group = bufferGeometry.groups[faceIndex];
            if (!group) return [] as { index: number; position: THREE.Vector3 }[];
            const start = group.start;
            const indices = indexArray
                ? [indexArray[start], indexArray[start + 1], indexArray[start + 2]]
                : [start, start + 1, start + 2];
            return indices.map((idx) => ({
                index: idx,
                position: new THREE.Vector3(positionAttr.getX(idx), positionAttr.getY(idx), positionAttr.getZ(idx)),
            }));
        };

        faces.forEach(({ normal, value }, faceIndex) => {
            const normalVec = new THREE.Vector3(normal.x, normal.y, normal.z).normalize();
            const faceOffset = faceOffsets?.[faceIndex] ?? radius * 0.88;
            const offset = faceOffset * 1.03;
            const plateMaterialOptions = {
                transparent: true,
                polygonOffset: true,
                polygonOffsetFactor: -1,
                polygonOffsetUnits: -1,
                depthTest: true,
                depthWrite: false,
            };

            const plateTargets: {
                position: THREE.Vector3;
                desiredUp?: THREE.Vector3;
                desiredRight?: THREE.Vector3;
                value?: number;
            }[] = [];
            if (sides === 4) {
                const faceVerts = getFaceVertices(faceIndex);
                const faceCenter = faceVerts
                    .reduce((acc, vertex) => acc.add(vertex.position), new THREE.Vector3())
                    .multiplyScalar(faceVerts.length > 0 ? 1 / faceVerts.length : 1);
                const inset = 0.5;
                const lift = offset - faceOffset;
                faceVerts.forEach((vertex, vertexIndex) => {
                    const otherA = faceVerts[(vertexIndex + 1) % faceVerts.length];
                    const otherB = faceVerts[(vertexIndex + 2) % faceVerts.length];
                    const position = faceCenter
                        .clone()
                        .add(vertex.position.clone().sub(faceCenter).multiplyScalar(inset))
                        .add(normalVec.clone().multiplyScalar(lift));
                    const desiredUp = vertex.position
                        .clone()
                        .sub(position)
                        .projectOnPlane(normalVec)
                        .normalize();
                    const edgeDir = otherB.position
                        .clone()
                        .sub(otherA.position)
                        .projectOnPlane(normalVec)
                        .normalize();
                    plateTargets.push({
                        position,
                        desiredUp,
                        desiredRight: edgeDir,
                        value: d4VertexValues?.[vertex.index] ?? value,
                    });
                });
            } else if (sides === 10) {
                const faceVerts = getFaceVertices(faceIndex);
                const faceCenter = faceVerts
                    .reduce((acc, vertex) => acc.add(vertex.position), new THREE.Vector3())
                    .multiplyScalar(faceVerts.length > 0 ? 1 / faceVerts.length : 1);
                const lift = offset - normalVec.dot(faceCenter);
                const topVertex = faceVerts.find((vertex) => vertex.index === 0);
                const bottomVertex = faceVerts.find((vertex) => vertex.index === 1);
                const poleVertex = topVertex ?? bottomVertex ?? faceVerts[0];
                const otherVerts = faceVerts.filter((vertex) => vertex !== poleVertex);
                const desiredUp = poleVertex
                    ? poleVertex.position.clone().sub(faceCenter).projectOnPlane(normalVec).normalize()
                    : undefined;
                const desiredRight =
                    otherVerts.length >= 2
                        ? otherVerts[1].position
                            .clone()
                            .sub(otherVerts[0].position)
                            .projectOnPlane(normalVec)
                            .normalize()
                        : undefined;
                plateTargets.push({
                    position: faceCenter.clone().add(normalVec.clone().multiplyScalar(lift)),
                    desiredUp,
                    desiredRight,
                    value,
                });
            } else {
                plateTargets.push({ position: normalVec.clone().multiplyScalar(offset), value });
            }

            plateTargets.forEach(({ position, desiredUp, desiredRight, value: plateValue }) => {
                const faceTexture = createFaceTexture(plateValue ?? value, sides);
                updateFaceTextureColor(faceTexture, new THREE.Color(getDieTextColor(index)).getStyle());
                const plateMaterial = new THREE.MeshBasicMaterial({
                    map: faceTexture.texture,
                    ...plateMaterialOptions,
                });
                const plate = new THREE.Mesh(plateGeometry, plateMaterial);
                plate.position.copy(position);
                plate.userData.value = plateValue ?? value;
                plate.userData.faceTexture = faceTexture;
                plate.userData.faceIndex = faceIndex;
                if (desiredUp && desiredRight) {
                    let right = desiredRight.clone().normalize();
                    let up = normalVec.clone().cross(right).normalize();
                    if (up.dot(desiredUp) < 0) {
                        right.multiplyScalar(-1);
                        up = normalVec.clone().cross(right).normalize();
                    }
                    const basis = new THREE.Matrix4().makeBasis(right, up, normalVec);
                    plate.quaternion.setFromRotationMatrix(basis);
                } else {
                    plateQuatRef.current.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normalVec);
                    plate.quaternion.copy(plateQuatRef.current);
                }
                mesh.add(plate);
                facePlates.push(plate);
            });
        });
        if (collisionScale && shape instanceof ConvexPolyhedron) {
            shape.vertices.forEach((vertex) => vertex.scale(collisionScale));
            shape.updateBoundingSphereRadius();
        }

        const body = new Body({
            mass: 1,
            shape,
            material: diceMaterial,
        });
        body.position.set(mesh.position.x, mesh.position.y, mesh.position.z);
        body.angularDamping = 0.35;
        body.linearDamping = 0.2;
        body.allowSleep = true;
        body.sleepSpeedLimit = 0.15;
        body.sleepTimeLimit = 0.4;
        worldRef.current?.addBody(body);
        const die: DiceInstance = {
            mesh,
            body,
            faces,
            soundUrl: collisionSoundUrls?.[index] ?? collisionSoundUrl,
            facePlates,
            faceOffsets,
            radius,
            sides,
            d4VertexValues,
        };
        const collideHandler = (event: { contact?: { getImpactVelocityAlongNormal: () => number } }) => {
            const impact = event.contact?.getImpactVelocityAlongNormal?.() ?? 0;
            playImpactSound(Math.abs(impact), die.soundUrl);
        };
        body.addEventListener('collide', collideHandler);
        die.collideHandler = collideHandler;

        diceRef.current.push(die);

        setupThumbnail(die, thumbnailCanvasesRef.current?.[index] ?? null);
    };

    const createDiceSet = (sidesList: number[], diceMaterial: Material) => {
        if (!sceneRef.current || !worldRef.current) return;
        clearDice();

        sidesList.forEach((sides, index) => {
            createDie(sides, index, diceMaterial, true);
        });
    };

    const rollDice = (impulseDirection?: { x: number; z: number }) => {
        if (!worldRef.current) return;
        lastResultsRef.current = [];
        pulseActiveRef.current = false;
        resetPlateHighlights();
        diceRef.current.forEach((die) => {
            die.rollingResult = undefined;
        });
        onRollingResults?.([]);
        onResults?.([]);

        const impulseBase = impulseDirection
            ? new Vec3(impulseDirection.x * 6, 6 + Math.random() * 2, impulseDirection.z * 6)
            : new Vec3((Math.random() - 0.5) * 6, 7 + Math.random() * 2, (Math.random() - 0.5) * 6);

        diceRef.current.forEach(({ body }) => {
            body.wakeUp();
            body.sleepState = 0;
            body.sleepTimeLimit = 0.4;
            body.velocity.setZero();
            body.angularVelocity.setZero();
            body.quaternion.setFromEuler(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            const impulse = new Vec3(
                impulseBase.x + (Math.random() - 0.5) * 2,
                impulseBase.y + Math.random() * 1.5,
                impulseBase.z + (Math.random() - 0.5) * 2
            );
            const torque = new Vec3(
                (Math.random() - 0.5) * 12,
                (Math.random() - 0.5) * 12,
                (Math.random() - 0.5) * 12
            );
            body.applyImpulse(impulse, body.position);
            body.applyTorque(torque);
        });

        settleFramesRef.current = 0;
        resultEmittedRef.current = false;
        zoomOutRef.current = false;
        lastTimeRef.current = performance.now();

        // keep current camera target to avoid jump on roll
        orbitAngleRef.current = Math.random() * Math.PI * 2;

    };

    const primeAudio = () => {
        if (audioPrimedRef.current) return;
        audioPrimedRef.current = true;
        Object.values(audioPoolRef.current).forEach((pool) => {
            pool.forEach((audio) => {
                audio.volume = 0;
                audio.currentTime = 0;
                audio.play()
                    .then(() => {
                        audio.pause();
                        audio.currentTime = 0;
                    })
                    .catch(() => {
                        // ignore autoplay blocking
                    });
            });
        });
    };

    useEffect(() => {
        const urls = Array.from(
            new Set([
                ...(collisionSoundUrls ?? []),
                ...(collisionSoundUrl ? [collisionSoundUrl] : []),
            ])
        );
        if (urls.length === 0) {
            audioPoolRef.current = {};
            return;
        }

        const pool: Record<string, HTMLAudioElement[]> = {};
        urls.forEach((url) => {
            pool[url] = Array.from({ length: 4 }, () => {
                const audio = new Audio(url);
                audio.preload = 'auto';
                return audio;
            });
        });

        audioPoolRef.current = pool;
    }, [collisionSoundUrl, collisionSoundUrls]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return undefined;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#0b0b0f');
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.set(6, 7.5, 9);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        rendererRef.current = renderer;
        container.appendChild(renderer.domElement);

        const world = new World({ gravity: new Vec3(0, -9.82, 0) });
        worldRef.current = world;

        const diceMaterial = new Material('dice');
        diceMaterialRef.current = diceMaterial;
        const floorMaterial = new Material('floor');
        world.addContactMaterial(
            new ContactMaterial(diceMaterial, floorMaterial, {
                friction: 0.35,
                restitution: 0.55,
            })
        );
        world.addContactMaterial(
            new ContactMaterial(diceMaterial, diceMaterial, {
                friction: 0.2,
                restitution: 0.6,
            })
        );

        const floorBody = new Body({ mass: 0, material: floorMaterial, shape: new Plane() });
        floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        world.addBody(floorBody);

        const floorSize = tableHalfSize * 2 + 2;
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(floorSize, floorSize),
            new THREE.MeshStandardMaterial({
                color: '#1c1f26',
                roughness: 0.9,
                metalness: 0.1,
                polygonOffset: true,
                polygonOffsetFactor: 1,
                polygonOffsetUnits: 1,
            })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.01;
        floor.receiveShadow = true;
        scene.add(floor);

        const wallThickness = 0.25;
        const wallHeight = tableWallHeight;
        const halfSize = tableHalfSize;
        const wallShapeH = new Box(new Vec3(halfSize, wallHeight, wallThickness));
        const wallShapeV = new Box(new Vec3(wallThickness, wallHeight, halfSize));

        const wallPositions = [
            { x: 0, y: wallHeight, z: -halfSize, shape: wallShapeH },
            { x: 0, y: wallHeight, z: halfSize, shape: wallShapeH },
            { x: -halfSize, y: wallHeight, z: 0, shape: wallShapeV },
            { x: halfSize, y: wallHeight, z: 0, shape: wallShapeV },
        ];

        wallPositions.forEach(({ x, y, z, shape }) => {
            const wallBody = new Body({ mass: 0, material: floorMaterial, shape });
            wallBody.position.set(x, y, z);
            world.addBody(wallBody);
        });

        const ceilingThickness = 0.2;
        const ceilingShape = new Box(new Vec3(halfSize, ceilingThickness, halfSize));
        const ceilingBody = new Body({ mass: 0, material: floorMaterial, shape: ceilingShape });
        ceilingBody.position.set(0, tableCeilingHeight, 0);
        world.addBody(ceilingBody);

        const borderGeometry = new THREE.BoxGeometry(halfSize * 2, 0.02, halfSize * 2);
        const borderEdges = new THREE.EdgesGeometry(borderGeometry);
        const borderLines = new THREE.LineSegments(
            borderEdges,
            new THREE.LineBasicMaterial({ color: '#7f8cff', transparent: true, opacity: 0.6 })
        );
        borderLines.position.set(0, 0.01, 0);
        scene.add(borderLines);

        const createWallGradientTexture = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            if (!ctx) return new THREE.CanvasTexture(canvas);

            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, 'rgba(0, 255, 212, 0)');
            gradient.addColorStop(0.4, 'rgba(0, 255, 212, 0)');
            gradient.addColorStop(0.7, 'rgba(0, 255, 212, 0.12)');
            gradient.addColorStop(1, 'rgba(0, 255, 212, 0.35)');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;
            return texture;
        };

        const wallTexture = createWallGradientTexture();
        const wallMaterial = new THREE.MeshBasicMaterial({
            map: wallTexture,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
        });

        const wallWidth = halfSize * 2;
        const wallGeometryH = new THREE.PlaneGeometry(wallWidth, wallHeight);
        const wallGeometryV = new THREE.PlaneGeometry(wallWidth, wallHeight);

        const wallNorth = new THREE.Mesh(wallGeometryH, wallMaterial);
        wallNorth.position.set(0, wallHeight / 2, -halfSize);
        scene.add(wallNorth);

        const wallSouth = new THREE.Mesh(wallGeometryH, wallMaterial);
        wallSouth.position.set(0, wallHeight / 2, halfSize);
        wallSouth.rotation.y = Math.PI;
        scene.add(wallSouth);

        const wallWest = new THREE.Mesh(wallGeometryV, wallMaterial);
        wallWest.position.set(-halfSize, wallHeight / 2, 0);
        wallWest.rotation.y = Math.PI / 2;
        scene.add(wallWest);

        const wallEast = new THREE.Mesh(wallGeometryV, wallMaterial);
        wallEast.position.set(halfSize, wallHeight / 2, 0);
        wallEast.rotation.y = -Math.PI / 2;
        scene.add(wallEast);

        const ambient = new THREE.AmbientLight(ambientLightColor, ambientLightIntensity);
        scene.add(ambient);
        ambientLightRef.current = ambient;

        const keyLight = new THREE.DirectionalLight(keyLightColor, keyLightIntensity);
        keyLight.position.set(keyLightPosition.x, keyLightPosition.y, keyLightPosition.z);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(1024, 1024);
        const keyLightTargetObject = new THREE.Object3D();
        keyLightTargetObject.position.set(keyLightTarget.x, keyLightTarget.y, keyLightTarget.z);
        keyLight.target = keyLightTargetObject;
        scene.add(keyLightTargetObject);
        scene.add(keyLight);
        keyLightRef.current = keyLight;
        keyLightTargetRef.current = keyLightTargetObject;

        const fillLight = new THREE.DirectionalLight(fillLightColor, fillLightIntensity);
        fillLight.position.set(-6, 6, -4);
        scene.add(fillLight);
        fillLightRef.current = fillLight;

        const resize = () => {
            if (!container) return;
            const { clientWidth, clientHeight } = container;
            renderer.setSize(clientWidth, clientHeight);
            camera.aspect = clientWidth / clientHeight;
            camera.updateProjectionMatrix();
        };

        resize();
        window.addEventListener('resize', resize);

        createDiceSet(resolvedSides, diceMaterial);

        const animate = () => {
            const now = performance.now();
            const delta = Math.min((now - lastTimeRef.current) / 1000, 1 / 30);
            lastTimeRef.current = now;
            world.step(1 / 60, delta, 3);

            diceRef.current.forEach(({ mesh, body }) => {
                mesh.position.set(body.position.x, body.position.y, body.position.z);
                mesh.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
            });

            diceRef.current.forEach((die) => {
                if (!die.thumbnail) return;
                const { renderer, camera, scene, mesh: thumbMesh, canvas } = die.thumbnail;
                const width = canvas.clientWidth || 72;
                const height = canvas.clientHeight || 72;
                if (renderer.getSize(new THREE.Vector2()).width !== width || renderer.getSize(new THREE.Vector2()).height !== height) {
                    renderer.setSize(width, height, false);
                    camera.aspect = width / height;
                    camera.updateProjectionMatrix();
                }
                thumbMesh.quaternion.copy(die.mesh.quaternion);
                renderer.render(scene, camera);
            });

            const camera = cameraRef.current;
            if (camera && diceRef.current.length > 0) {
                if (zoomOutRef.current) {
                    const center = tableCenterRef.current;
                    const initialDir = initialCameraPosRef.current.clone().sub(center);
                    const initialDistance = initialDir.length();
                    const heightRatio = initialDistance > 0 ? initialDir.y / initialDistance : 0.6;

                    const dir = zoomOutDirRef.current;
                    if (dir.lengthSq() < 0.0001) {
                        dir.set(1, 0.9, 1);
                    }
                    const azimuth = Math.atan2(dir.z, dir.x);
                    dir.set(Math.cos(azimuth), heightRatio, Math.sin(azimuth)).normalize();

                    const desired = cameraDesiredRef.current;
                    desired.copy(center).addScaledVector(dir, initialDistance);
                    desired.y = Math.max(desired.y, 2.6);

                    cameraTargetRef.current.lerp(initialCameraTargetRef.current, 0.02);
                    camera.position.lerp(desired, 0.012);
                    camera.lookAt(cameraTargetRef.current);
                } else {
                    const bounds = boundsRef.current;
                    bounds.makeEmpty();
                    diceRef.current.forEach(({ mesh }) => bounds.expandByPoint(mesh.position));
                    bounds.getBoundingSphere(boundsSphereRef.current);

                    const center = boundsSphereRef.current.center;
                    const radius = Math.max(boundsSphereRef.current.radius, 0.5);
                    const isSingle = diceRef.current.length === 1;
                    const padding = isSingle ? 2.6 : 2.8;
                    const fov = THREE.MathUtils.degToRad(camera.fov);
                    const minDistance = isSingle ? 4.5 : 6;
                    const maxDistance = isSingle ? 8 : 12;
                    const distance = Math.min(
                        Math.max((radius * padding) / Math.sin(fov / 2), minDistance),
                        maxDistance
                    );

                    const dir = cameraDirRef.current;
                    if (orbitSpeed > 0) {
                        orbitAngleRef.current += orbitSpeed * delta;
                        dir.set(Math.cos(orbitAngleRef.current), 0.9, Math.sin(orbitAngleRef.current));
                    } else {
                        dir.copy(camera.position).sub(center);
                        if (dir.lengthSq() < 0.0001) {
                            dir.set(1, 0.9, 1);
                        }
                    }
                    dir.normalize();

                    const desired = cameraDesiredRef.current;
                    desired.copy(center).addScaledVector(dir, distance);
                    desired.y = Math.max(desired.y, 2.6);

                    const target = cameraTargetRef.current;
                    const targetDeadZone = 0.7;
                    const targetDelta = target.distanceTo(center);
                    if (targetDelta > targetDeadZone) {
                        target.lerp(center, 0.015);
                    }

                    camera.position.lerp(desired, 0.006);
                    camera.lookAt(target);
                }
            }

            const allStopped = diceRef.current.every(({ body }) => {
                const speed = body.velocity.length();
                const spin = body.angularVelocity.length();
                return speed < 0.05 && spin < 0.05;
            });

            if (allStopped) {
                settleFramesRef.current += 1;
            } else {
                settleFramesRef.current = 0;
            }

            if (settleFramesRef.current > 30 && !resultEmittedRef.current) {
                const results = diceRef.current.map((die) => getTopDieValue(die));
                resultEmittedRef.current = true;
                lastResultsRef.current = results;
                pulseActiveRef.current = true;
                zoomOutRef.current = true;
                if (camera) {
                    zoomOutDirRef.current.copy(camera.position).sub(tableCenterRef.current).normalize();
                }
                onResults?.(results);
            }

            if (zoomOutRef.current && camera && pulseActiveRef.current) {
                const desired = cameraDesiredRef.current;
                const target = cameraTargetRef.current;
                const targetDelta = target.distanceTo(initialCameraTargetRef.current);
                const positionDelta = camera.position.distanceTo(desired);
                if (positionDelta < 0.05 && targetDelta < 0.05) {
                    pulseActiveRef.current = false;
                }
            }

            if (resultEmittedRef.current && lastResultsRef.current.length > 0) {
                const pulse = pulseActiveRef.current ? (Math.sin(performance.now() * 0.008) + 1) / 2 : 1;
                diceRef.current.forEach((die, index) => {
                    const targetValue = lastResultsRef.current[index];
                    const baseText = new THREE.Color(getDieTextColor(index));
                    const highlightColor = new THREE.Color(getDieHighlightColor(index));
                    const textColorValue = baseText.clone().lerp(highlightColor, pulse).getStyle();

                    die.facePlates?.forEach((plate) => {
                        if (!(plate.material instanceof THREE.MeshBasicMaterial)) return;
                        const plateValue = plate.userData.value as number | undefined;
                        const faceTexture = plate.userData.faceTexture as FaceTexture | undefined;

                        if (plateValue === targetValue) {
                            plate.material.color.copy(BASE_PLATE_COLOR);
                            plate.material.opacity = 1;
                            if (faceTexture) updateFaceTextureColor(faceTexture, textColorValue);
                        } else {
                            plate.material.color.copy(BASE_PLATE_COLOR);
                            plate.material.opacity = 1;
                            if (faceTexture) updateFaceTextureColor(faceTexture, baseText.getStyle());
                        }
                    });
                });
            }

            const nowMs = performance.now();
            if (!resultEmittedRef.current && nowMs - lastRollingUpdateRef.current > 90) {
                const rollingResults = diceRef.current.map((die) => {
                    const spinSpeed = die.body.angularVelocity.length();
                    const speedFactor = Math.min(Math.max(spinSpeed / 8, 0.2), 2);
                    const sidesCount = die.faces.length || 6;
                    if (!die.rollingResult || Math.random() < 0.35 * speedFactor) {
                        die.rollingResult = Math.floor(Math.random() * sidesCount) + 1;
                    } else {
                        die.rollingResult = ((die.rollingResult - 1 + Math.ceil(speedFactor)) % sidesCount) + 1;
                    }
                    return die.rollingResult;
                });
                lastRollingUpdateRef.current = nowMs;
                onRollingResults?.(rollingResults);
            }

            if (camera) {
                renderer.render(scene, camera);
            }
            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        const handlePointerDown = (event: PointerEvent) => {
            primeAudio();
            pointerStartRef.current = {
                x: event.clientX,
                y: event.clientY,
                time: performance.now(),
            };
        };

        const handlePointerUp = (event: PointerEvent) => {
            if (!pointerStartRef.current) return;
            const { x, y, time } = pointerStartRef.current;
            const dx = event.clientX - x;
            const dy = event.clientY - y;
            const dt = Math.max(performance.now() - time, 1);

            const swipeMagnitude = Math.hypot(dx, dy);
            if (swipeMagnitude < 10 || dt > 500) {
                rollDice();
            } else {
                const directionX = dx / swipeMagnitude;
                const directionZ = -dy / swipeMagnitude;
                rollDice({ x: directionX, z: directionZ });
            }

            pointerStartRef.current = null;
        };

        renderer.domElement.addEventListener('pointerdown', handlePointerDown);
        renderer.domElement.addEventListener('pointerup', handlePointerUp);

        return () => {
            renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
            renderer.domElement.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('resize', resize);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            clearDice();
            world.bodies.forEach((body) => world.removeBody(body));
            renderer.dispose();
            container.removeChild(renderer.domElement);
        };
    }, []);

    useEffect(() => {
        if (!worldRef.current) return;
        const diceMaterial = diceMaterialRef.current;
        if (!diceMaterial) return;

        const prevSides = [...prevSidesRef.current];
        const nextSides = [...resolvedSides];

        if (prevSides.length === 0 && nextSides.length > 0) {
            createDiceSet(nextSides, diceMaterial);
            prevSidesRef.current = nextSides;
            if (autoRollOnSetup) {
                rollDice();
            }
            return;
        }

        let changed = true;
        while (changed) {
            changed = false;
            const minLen = Math.min(prevSides.length, nextSides.length);
            let mismatchIndex = -1;
            for (let i = 0; i < minLen; i += 1) {
                if (prevSides[i] !== nextSides[i]) {
                    mismatchIndex = i;
                    break;
                }
            }

            if (prevSides.length > nextSides.length) {
                const removeIndex = mismatchIndex !== -1 ? mismatchIndex : prevSides.length - 1;
                removeDieAt(removeIndex);
                prevSides.splice(removeIndex, 1);
                changed = true;
                continue;
            }

            if (prevSides.length < nextSides.length) {
                for (let i = prevSides.length; i < nextSides.length; i += 1) {
                    createDie(nextSides[i], i, diceMaterial, true);
                }
                prevSidesRef.current = nextSides;
                return;
            }

            if (mismatchIndex !== -1) {
                removeDieAt(mismatchIndex);
                createDie(nextSides[mismatchIndex], mismatchIndex, diceMaterial, true);
                prevSides[mismatchIndex] = nextSides[mismatchIndex];
                changed = true;
            }
        }

        prevSidesRef.current = nextSides;
    }, [resolvedSides, collisionSoundUrls, collisionSoundUrl, autoRollOnSetup]);

    useEffect(() => {
        diceRef.current.forEach((die, index) => {
            die.soundUrl = collisionSoundUrls?.[index] ?? collisionSoundUrl;
        });
    }, [collisionSoundUrls, collisionSoundUrl]);

    useEffect(() => {
        resetPlateHighlights();
    }, [textColor, textColors]);

    useEffect(() => {
        textColorRef.current = textColor;
    }, [textColor]);

    useEffect(() => {
        textColorsRef.current = textColors;
    }, [textColors]);

    useEffect(() => {
        highlightTextColorRef.current = highlightTextColor;
    }, [highlightTextColor]);

    useEffect(() => {
        highlightTextColorsRef.current = highlightTextColors;
    }, [highlightTextColors]);

    useEffect(() => {
        thumbnailCanvasesRef.current = thumbnailCanvases;
        diceRef.current.forEach((die, index) => {
            setupThumbnail(die, thumbnailCanvases?.[index] ?? null);
        });
    }, [thumbnailCanvases]);

    useEffect(() => {
        diceRef.current.forEach((die, index) => {
            const meshMaterials = die.mesh.material;
            if (Array.isArray(meshMaterials)) {
                meshMaterials.forEach((material) => {
                    if (material instanceof THREE.MeshStandardMaterial) {
                        material.color.set(diceColors?.[index] ?? diceColor);
                        material.roughness = diceRoughnesses?.[index] ?? diceRoughness;
                        material.metalness = diceMetalnesses?.[index] ?? diceMetalness;
                        material.needsUpdate = true;
                    }
                });
            }
        });
    }, [diceColor, diceRoughness, diceMetalness, diceColors, diceRoughnesses, diceMetalnesses]);

    useEffect(() => {
        if (!worldRef.current) return;
        rollDice();
    }, [rollKey]);

    useEffect(() => {
        const light = keyLightRef.current;
        const target = keyLightTargetRef.current;
        if (light) {
            light.position.set(keyLightPosition.x, keyLightPosition.y, keyLightPosition.z);
        }
        if (target) {
            target.position.set(keyLightTarget.x, keyLightTarget.y, keyLightTarget.z);
        }
    }, [keyLightPosition, keyLightTarget]);

    useEffect(() => {
        if (ambientLightRef.current) {
            ambientLightRef.current.color.set(ambientLightColor);
            ambientLightRef.current.intensity = ambientLightIntensity;
        }
        if (keyLightRef.current) {
            keyLightRef.current.color.set(keyLightColor);
            keyLightRef.current.intensity = keyLightIntensity;
        }
        if (fillLightRef.current) {
            fillLightRef.current.color.set(fillLightColor);
            fillLightRef.current.intensity = fillLightIntensity;
        }
    }, [
        ambientLightColor,
        ambientLightIntensity,
        keyLightColor,
        keyLightIntensity,
        fillLightColor,
        fillLightIntensity,
    ]);

    return (
        <div className="physics-dice" ref={containerRef}>
            <div className="physics-dice__overlay">
                <div className="physics-dice__hint">Tap/click to roll. Swipe to throw.</div>
                {results && results.length > 0 && (
                    <div className="physics-dice__results">
                        Result: {results.join(', ')} (Total {results.reduce((sum, value) => sum + value, 0)})
                    </div>
                )}
            </div>
        </div>
    );
};

export default PhysicsDice;
