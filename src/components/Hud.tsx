import { RotateCcw } from "lucide-react";
import { FLOWER_DEFS, FLOWER_SPRITE, HEART } from "../game/config";
import type { GameState } from "../game/types";

type HudProps = {
  state: GameState;
  onRetry: () => void;
};

export default function Hud({ state, onRetry }: HudProps) {
  const seconds = Math.ceil(state.heart.timerMs / 1000);
  const collectedFlowers = state.collectedOrder
    .map((id) => FLOWER_DEFS.find((flower) => flower.id === id))
    .filter((flower): flower is (typeof FLOWER_DEFS)[number] =>
      Boolean(flower),
    );
  const bouquetCenter = (collectedFlowers.length - 1) / 2;

  return (
    <div className="hud">
      <div
        className={`bouquet ${collectedFlowers.length > 0 ? "has-flowers" : ""}`}
        aria-label={`${state.collectedOrder.length} of ${FLOWER_DEFS.length} flowers collected`}
      >
        {collectedFlowers.length === 0 ? (
          <div className="bouquet-empty">Bouquet</div>
        ) : null}
        {collectedFlowers.map((flower, index) => {
          const spread = index - bouquetCenter;
          return (
            <span
              key={`${flower.id}-${index}`}
              className="bouquet-picked-flower"
              style={
                {
                  "--sprite-x": `-${flower.sprite.x}px`,
                  "--sprite-y": `-${flower.sprite.y}px`,
                  "--flower-x": `${spread * 14}px`,
                  "--flower-y": `${Math.abs(spread) * 3}px`,
                  "--flower-rotation": `${spread * 14}deg`,
                  backgroundImage: `url(${FLOWER_SPRITE.src})`,
                } as React.CSSProperties
              }
              title={flower.label}
            />
          );
        })}
      </div>
      {state.phase === "heart" ? (
        <div className="timer" aria-label={`${seconds} seconds left`}>
          {seconds}s
        </div>
      ) : null}
      {state.phase === "retry" ? (
        <div className="retry-panel">
          <p>{state.lastMessage}</p>
          <button type="button" onClick={onRetry}>
            <RotateCcw size={16} />
            Повторить
          </button>
        </div>
      ) : null}
      {state.phase === "heart" ? (
        <div
          className="heart-bar"
          style={{
            transform: `scaleX(${state.heart.timerMs / HEART.durationMs})`,
          }}
        />
      ) : null}
    </div>
  );
}
