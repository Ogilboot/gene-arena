import { useId } from "react";
import type { ReactNode } from "react";
import { computeAppearance } from "../game/appearance";
import type { CreatureAppearance } from "../game/appearance";
import type { Creature } from "../game";

function legXs(count: number): number[] {
  switch (count) {
    case 2:
      return [82, 118];
    case 3:
      return [72, 100, 128];
    default:
      return [66, 88, 112, 134];
  }
}

function renderTail(a: CreatureAppearance): ReactNode {
  const x = 156;
  const y = 130;
  switch (a.tailType) {
    case 1:
      return (
        <path d={`M ${x} ${y} q 18 4 22 -14`} fill="none" stroke={a.bodyDark} strokeWidth={6} strokeLinecap="round" />
      );
    case 2:
      return (
        <path d={`M ${x} ${y} q 24 10 14 28 q -6 8 2 16`} fill="none" stroke={a.bodyDark} strokeWidth={6} strokeLinecap="round" />
      );
    case 3:
      return (
        <polyline
          points={`${x},${y} ${x + 14},${y - 12} ${x + 22},${y - 2} ${x + 32},${y - 14}`}
          fill="none"
          stroke={a.bodyDark}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    default:
      return null;
  }
}

function renderLegs(a: CreatureAppearance): ReactNode {
  return (
    <>
      {legXs(a.legCount).map((x, i) => (
        <rect key={i} x={x - 6} y={160} width={12} height={20} rx={5} fill={a.bodyDark} />
      ))}
    </>
  );
}

function renderPattern(a: CreatureAppearance, clipId: string): ReactNode {
  if (a.pattern === "none") return null;
  return (
    <g clipPath={`url(#${clipId})`}>
      {a.pattern === "spots" ? (
        <>
          <circle cx={88} cy={108} r={7} fill={a.accent} opacity={0.75} />
          <circle cx={112} cy={118} r={8} fill={a.accent} opacity={0.75} />
          <circle cx={104} cy={142} r={6} fill={a.accent} opacity={0.75} />
          <circle cx={92} cy={136} r={5} fill={a.accent} opacity={0.75} />
          <circle cx={120} cy={134} r={5} fill={a.accent} opacity={0.75} />
        </>
      ) : (
        <>
          <rect x={84} y={88} width={9} height={60} rx={4} fill={a.accent} opacity={0.7} transform="rotate(8 88 118)" />
          <rect x={104} y={88} width={9} height={60} rx={4} fill={a.accent} opacity={0.7} transform="rotate(-6 108 118)" />
          <rect x={124} y={92} width={9} height={56} rx={4} fill={a.accent} opacity={0.7} transform="rotate(8 128 120)" />
        </>
      )}
    </g>
  );
}

function renderEars(a: CreatureAppearance): ReactNode {
  const left = 78;
  const right = 122;
  const y = 82;
  switch (a.earType) {
    case "round":
      return (
        <>
          <circle cx={left} cy={y} r={13} fill={a.bodyColor} stroke={a.bodyDark} strokeWidth={3} />
          <circle cx={right} cy={y} r={13} fill={a.bodyColor} stroke={a.bodyDark} strokeWidth={3} />
        </>
      );
    case "pointed":
      return (
        <>
          <polygon
            points={`${left - 12},${y + 8} ${left},${y - 16} ${left + 12},${y + 8}`}
            fill={a.bodyColor}
            stroke={a.bodyDark}
            strokeWidth={3}
          />
          <polygon
            points={`${right - 12},${y + 8} ${right},${y - 16} ${right + 12},${y + 8}`}
            fill={a.bodyColor}
            stroke={a.bodyDark}
            strokeWidth={3}
          />
        </>
      );
    case "horns":
      return (
        <>
          <path d={`M ${left - 6} ${y + 6} q -2 -16 6 -20`} fill="none" stroke={a.accent} strokeWidth={5} strokeLinecap="round" />
          <path d={`M ${right + 6} ${y + 6} q 2 -16 -6 -20`} fill="none" stroke={a.accent} strokeWidth={5} strokeLinecap="round" />
        </>
      );
    case "antennae":
      return (
        <>
          <line x1={left} y1={y + 4} x2={left - 8} y2={y - 18} stroke={a.bodyDark} strokeWidth={3} />
          <circle cx={left - 8} cy={y - 22} r={5} fill={a.accent} />
          <line x1={right} y1={y + 4} x2={right + 8} y2={y - 18} stroke={a.bodyDark} strokeWidth={3} />
          <circle cx={right + 8} cy={y - 22} r={5} fill={a.accent} />
        </>
      );
    default:
      return null;
  }
}

function renderEyes(a: CreatureAppearance): ReactNode {
  const y = 110;
  const positions = [82, 118];
  if (a.eyeType === 1) {
    return (
      <>
        {positions.map((x) => (
          <g key={x}>
            <circle cx={x} cy={y} r={8} fill="#ffffff" />
            <circle cx={x} cy={y} r={3.5} fill={a.eyeColor} />
          </g>
        ))}
      </>
    );
  }
  if (a.eyeType === 2) {
    return (
      <>
        {positions.map((x) => (
          <ellipse key={x} cx={x} cy={y} rx={7} ry={5} fill={a.eyeColor} />
        ))}
      </>
    );
  }
  return (
    <>
      {positions.map((x) => (
        <circle key={x} cx={x} cy={y} r={4.5} fill={a.eyeColor} />
      ))}
    </>
  );
}

function renderSparkles(a: CreatureAppearance): ReactNode {
  if (!a.shiny) return null;
  return (
    <>
      <polygon points="150,64 157,71 150,78 143,71" fill={a.accent} />
      <polygon points="42,62 47,67 42,72 37,67" fill={a.accent} />
      <polygon points="172,124 176,128 172,132 168,128" fill={a.accent} />
    </>
  );
}

interface Props {
  creature: Creature;
  size?: number;
}

export function CreatureSprite({ creature, size = 96 }: Props) {
  const a = computeAppearance(creature);
  const clipId = useId().replace(/:/g, "x");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label={`${creature.phenotype.elements.join(" / ")} creature`}
    >
      <defs>
        <clipPath id={clipId}>
          <ellipse cx={100} cy={122} rx={56 * a.bodyW} ry={46 * a.bodyH} />
        </clipPath>
      </defs>

      {renderTail(a)}
      {renderLegs(a)}
      <ellipse
        cx={100}
        cy={122}
        rx={56 * a.bodyW}
        ry={46 * a.bodyH}
        fill={a.bodyColor}
        stroke={a.bodyDark}
        strokeWidth={3}
      />
      <ellipse cx={82} cy={104} rx={18} ry={10} fill="#ffffff" opacity={0.18} />
      {renderPattern(a, clipId)}
      {renderEars(a)}
      {renderEyes(a)}
      <path d="M 94 128 q 6 6 12 0" fill="none" stroke={a.bodyDark} strokeWidth={2.5} strokeLinecap="round" />
      {renderSparkles(a)}
    </svg>
  );
}
