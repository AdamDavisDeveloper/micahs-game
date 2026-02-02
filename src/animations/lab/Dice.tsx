import { useRef, useEffect, useState } from 'react';
import './Dice.scss';

interface DiceProps {
	// Optional props for customization
	size?: number;
	animationDuration?: number;
	animationName?: 'diceRotate1' | 'diceRotate2' | 'diceRotate3';
	animationKey?: number;
	diceValues?: number[];
}

export const Dice: React.FC<DiceProps> = ({
	size = 200,
	animationDuration = 1.3,
	animationName = 'diceRotate1',
	animationKey = 0,
	diceValues = [1, 2, 3, 4, 5, 6],
}) => {
	const sceneRef = useRef<HTMLDivElement>(null);
	const [offsetX, setOffsetX] = useState(0);

	useEffect(() => {
		const scene = sceneRef.current;
		if (!scene) return;

		let initialX: number;
		let currentOffsetX = offsetX;

		const handleMouseDown = (e: MouseEvent) => {
			initialX = e.clientX - currentOffsetX;

			const handleMouseMove = (moveEvent: MouseEvent) => {
				const newX = moveEvent.clientX - initialX;
				currentOffsetX = newX;
				setOffsetX(newX);

				scene.style.transform = `rotateY(${newX / 10}deg)`;
			};

			const handleMouseUp = () => {
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
			};

			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
		};

		scene.addEventListener('mousedown', handleMouseDown);

		return () => {
			scene.removeEventListener('mousedown', handleMouseDown);
		};
	}, [offsetX]);

	return (
		<div className="dice-container">
			<div className="dice-scene" ref={sceneRef}>
				<div className="dice-table">
					<div
						key={animationKey}
						className="dice-cube"
						style={{
							'--animation-duration': `${animationDuration}s`,
							'--animation-name': animationName,
						} as React.CSSProperties}
					>
						{/* Panel 1 */}
						<div className="dice-panel dice-panel-1">
							<div className="dice-number">{diceValues[0]}</div>
						</div>
						{/* Panel 2 */}
						<div className="dice-panel dice-panel-2">
							<div className="dice-number">{diceValues[1]}</div>
						</div>
						{/* Panel 3 */}
						<div className="dice-panel dice-panel-3">
							<div className="dice-number">{diceValues[2]}</div>
						</div>
						{/* Panel 4 */}
						<div className="dice-panel dice-panel-4">
							<div className="dice-number">{diceValues[3]}</div>
						</div>
						{/* Panel 5 */}
						<div className="dice-panel dice-panel-5">
							<div className="dice-number">{diceValues[4]}</div>
						</div>
						{/* Panel 6 */}
						<div className="dice-panel dice-panel-6">
							<div className="dice-number">{diceValues[5]}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Dice;
