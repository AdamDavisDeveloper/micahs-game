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
    tableHalfSize?: number;
    tableWallHeight?: number;
    tableCeilingHeight?: number;
    orbitSpeed?: number;
    onResults?: (results: number[]) => void;
};

type DiceInstance = {
    mesh: THREE.Mesh;
    body: Body;
    faces: FaceNormal[];
    collideHandler?: (event: { contact?: { getImpactVelocityAlongNormal: () => number } }) => void;
    soundUrl?: string;
};

type DiceDefinition = {
    geometry: THREE.BufferGeometry;
    shape: Box | ConvexPolyhedron;
    faces: FaceNormal[];
    materials: THREE.Material[];
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

const createFaceTexture = (value: number, sides: number) => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#141414';
    ctx.lineWidth = 12;
    ctx.strokeRect(0, 0, size, size);
    ctx.fillStyle = '#141414';
    const fontSize = sides > 12 ? 110 : sides > 8 ? 120 : 140;
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(value), size / 2, size / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return texture;
};

const createDiceMaterials = (values: number[], sides: number) =>
    values.map(
        (value) =>
            new THREE.MeshStandardMaterial({
                map: createFaceTexture(value, sides),
                roughness: 0.65,
                metalness: 0.1,
            })
    );

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

    return { vertices, faces, triangleNormals: normals, geometry: buffer };
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

const createPolyhedronDice = (geometry: THREE.BufferGeometry, sides: number, forceClusterCount?: number) => {
    const { vertices, faces, triangleNormals, geometry: buffer } = buildConvexFromGeometry(geometry);
    const { clusters, triangleToCluster } = clusterFaceNormals(triangleNormals);

    if (forceClusterCount && clusters.length !== forceClusterCount) {
        applyFaceGroups(buffer, triangleNormals.map((_, index) => index));
        const values = Array.from({ length: triangleNormals.length }, (_, i) => i + 1);
        return {
            geometry: buffer,
            shape: new ConvexPolyhedron({ vertices, faces }),
            faces: triangleNormals.map((normal, i) => ({ normal, value: values[i] })),
            materials: createDiceMaterials(values, sides),
        };
    }

    applyFaceGroups(buffer, triangleToCluster);
    const values = clusters.map((_, index) => index + 1);
    const faceNormals: FaceNormal[] = clusters.map((cluster, index) => ({
        normal: cluster.normal,
        value: values[index],
    }));

    return {
        geometry: buffer,
        shape: new ConvexPolyhedron({ vertices, faces }),
        faces: faceNormals,
        materials: createDiceMaterials(values, sides),
    };
};

const createCustomPolyhedron = (vertices: Vec3[], faces: number[][], sides: number) => {
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
    geometry.setIndex(faces.flat());
    geometry.computeVertexNormals();

    const triangleNormals = faces.map((face) => {
        const a = vertices[face[0]];
        const b = vertices[face[1]];
        const c = vertices[face[2]];
        const normal = b.vsub(a).cross(c.vsub(a));
        normal.normalize();
        return normal;
    });

    applyFaceGroups(geometry, triangleNormals.map((_, index) => index));
    const values = faces.map((_, index) => index + 1);

    return {
        geometry,
        shape: new ConvexPolyhedron({ vertices, faces }),
        faces: triangleNormals.map((normal, index) => ({ normal, value: values[index] })),
        materials: createDiceMaterials(values, sides),
    };
};

const createDiceDefinition = (sides: number): DiceDefinition => {
    switch (sides) {
        case 4: {
            const geometry = new THREE.TetrahedronGeometry(0.65);
            return createPolyhedronDice(geometry, sides, 4);
        }
        case 6: {
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            return {
                geometry,
                shape: new Box(new Vec3(0.5, 0.5, 0.5)),
                faces: D6_FACE_NORMALS,
                materials: createDiceMaterials([3, 4, 1, 6, 2, 5], sides),
            };
        }
        case 8: {
            const geometry = new THREE.OctahedronGeometry(0.7);
            return createPolyhedronDice(geometry, sides, 8);
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
            return createCustomPolyhedron(vertices, faces, sides);
        }
        case 12: {
            const geometry = new THREE.DodecahedronGeometry(0.7);
            return createPolyhedronDice(geometry, sides, 12);
        }
        case 20: {
            const geometry = new THREE.IcosahedronGeometry(0.75);
            return createPolyhedronDice(geometry, sides, 20);
        }
        default: {
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            return {
                geometry,
                shape: new Box(new Vec3(0.5, 0.5, 0.5)),
                faces: D6_FACE_NORMALS,
                materials: createDiceMaterials([3, 4, 1, 6, 2, 5], 6),
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
    tableHalfSize = 5.5,
    tableWallHeight = 2.5,
    tableCeilingHeight = 6,
    orbitSpeed = 0.12,
    onResults,
}: PhysicsDiceProps) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const worldRef = useRef<World | null>(null);
    const diceRef = useRef<DiceInstance[]>([]);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const animationRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(performance.now());
    const settleFramesRef = useRef(0);
    const resultEmittedRef = useRef(false);
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

    const resolvedSides = useMemo(() => {
        if (diceSides && diceSides.length > 0) return diceSides;
        return Array.from({ length: diceCount }, () => 6);
    }, [diceSides, diceCount]);

    const clearDice = () => {
        if (!sceneRef.current || !worldRef.current) return;
        diceRef.current.forEach(({ mesh, body, collideHandler }) => {
            sceneRef.current?.remove(mesh);
            if (collideHandler) body.removeEventListener('collide', collideHandler);
            worldRef.current?.removeBody(body);
            mesh.geometry.dispose();
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach((mat: THREE.Material) => mat.dispose());
            } else {
                mesh.material.dispose();
            }
        });
        diceRef.current = [];
    };

    const createDiceSet = (sidesList: number[], diceMaterial: Material) => {
        if (!sceneRef.current || !worldRef.current) return;
        clearDice();

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

        sidesList.forEach((sides, index) => {
            const { geometry, shape, faces, materials } = createDiceDefinition(sides);
            const mesh = new THREE.Mesh(geometry, materials);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.position.set((index - (sidesList.length - 1) / 2) * 1.6, 2.5 + index * 0.2, (Math.random() - 0.5) * 1.6);
            sceneRef.current?.add(mesh);
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
            const soundUrl = collisionSoundUrls?.[index] ?? collisionSoundUrl;
            const collideHandler = (event: { contact?: { getImpactVelocityAlongNormal: () => number } }) => {
                const impact = event.contact?.getImpactVelocityAlongNormal?.() ?? 0;
                playImpactSound(Math.abs(impact), soundUrl);
            };
            body.addEventListener('collide', collideHandler);

            diceRef.current.push({ mesh, body, faces, collideHandler, soundUrl });
        });
    };

    const rollDice = (impulseDirection?: { x: number; z: number }) => {
        if (!worldRef.current) return;

        const impulseBase = impulseDirection
            ? new Vec3(impulseDirection.x * 6, 6 + Math.random() * 2, impulseDirection.z * 6)
            : new Vec3((Math.random() - 0.5) * 6, 7 + Math.random() * 2, (Math.random() - 0.5) * 6);

        diceRef.current.forEach(({ body }, index) => {
            body.velocity.setZero();
            body.angularVelocity.setZero();
            body.position.set((index - (diceRef.current.length - 1) / 2) * 1.5, 3.5 + index * 0.2, (Math.random() - 0.5) * 2);
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

        const camera = cameraRef.current;
        if (camera) {
            camera.position.copy(initialCameraPosRef.current);
            camera.lookAt(initialCameraTargetRef.current);
            cameraTargetRef.current.copy(initialCameraTargetRef.current);
        }
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
            })
        );
        floor.rotation.x = -Math.PI / 2;
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

        const ambient = new THREE.AmbientLight('#ffffff', 0.5);
        scene.add(ambient);

        const keyLight = new THREE.DirectionalLight('#ffffff', 0.9);
        keyLight.position.set(6, 10, 4);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(1024, 1024);
        scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight('#7f8cff', 0.4);
        fillLight.position.set(-6, 6, -4);
        scene.add(fillLight);

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
            const delta = (now - lastTimeRef.current) / 1000;
            lastTimeRef.current = now;
            world.step(1 / 60, delta, 3);

            diceRef.current.forEach(({ mesh, body }) => {
                mesh.position.set(body.position.x, body.position.y, body.position.z);
                mesh.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
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
                const results = diceRef.current.map(({ body, faces }) => getTopFaceValue(body, faces));
                resultEmittedRef.current = true;
                zoomOutRef.current = true;
                zoomOutDirRef.current.copy(camera.position).sub(tableCenterRef.current).normalize();
                onResults?.(results);
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
        const diceMaterial = worldRef.current.bodies.find((body) => body.material?.name === 'dice')?.material;
        if (diceMaterial instanceof Material) {
            createDiceSet(resolvedSides, diceMaterial);
            rollDice();
        }
    }, [resolvedSides, collisionSoundUrls, collisionSoundUrl]);

    useEffect(() => {
        if (!worldRef.current) return;
        rollDice();
    }, [rollKey]);

    return (
        <div className="physics-dice" ref={containerRef}>
            <div className="physics-dice__overlay">
                <div className="physics-dice__hint">Tap/click to roll. Swipe to throw.</div>
            </div>
        </div>
    );
};

export default PhysicsDice;
