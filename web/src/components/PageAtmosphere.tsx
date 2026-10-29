import { VISUAL_ASSETS } from '../assets/visualManifest';
import './PageAtmosphere.css';

interface PageAtmosphereProps {
  title: string;
  subtitle?: string;
  badge?: string;
}

/** Shared page header with cream/sage/botanical treatment. */
export function PageAtmosphere({ title, subtitle, badge }: PageAtmosphereProps) {
  return (
    <header className="page-atmosphere botanical-frame">
      <img className="page-atmosphere-deco page-atmosphere-deco--left" src={VISUAL_ASSETS.decor.plant} alt="" aria-hidden />
      <img className="page-atmosphere-deco page-atmosphere-deco--right" src={VISUAL_ASSETS.decor.books} alt="" aria-hidden />
      <div className="page-atmosphere-text">
        <h1>{title}</h1>
        {subtitle ? <p className="page-atmosphere-sub">{subtitle}</p> : null}
      </div>
      {badge ? <span className="mutebadge page-atmosphere-badge">{badge}</span> : null}
    </header>
  );
}
