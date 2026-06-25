import './VoidBackground.css';

export function VoidBackground() {
  return (
    <div className="void-bg" aria-hidden="true">
      <div className="void-bg__grid" />
      <div className="void-bg__particles" />
      <div className="void-bg__scanline" />
    </div>
  );
}