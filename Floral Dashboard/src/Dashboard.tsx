import { useRef, useState, type CSSProperties } from 'react';
import { FloralDashboard } from './FloralDashboard';
import { AgentClock, ICON_SCALE, dotStyle, useDashboardMotion, type AgentStatus, type AgentValues } from './DashboardMotion';
import { Chevron, IconAnalyze, IconDeploy, IconSetting, IconTest, IconTrain, RailBottom1, RailBottom2, RailDivider, RailIcon5, RailIcon6, RailIcon7, RailLogomark, RailNotification, RailSparkleSearch, SidebarGlow, TileHighlights1, TileHighlights2, TileLogo, TileSubtract } from './dashboardIcons';
import type { ComponentType, SVGProps } from 'react';
import './dashboard.css';

/*
 * Figma 483:23065: the top-left corner of an app window, drawn at 2.049× (a 1440 × 900 window at 2950 × 1843.75),
 * on a light ground. A dark rail of icons on the left, a white sidebar with the menu, and an empty page. Every
 * size and offset is Figma's; the sidebar and rail are the same auto-layout stacks, so flex does the placing.
 * The rail's flower is the Floral Dashboard flower itself, scaled from its 442.986 px frame to 32.778 px; the icons are
 * dashboardIcons.tsx, Figma's vectors as code.
 */
// The company tile's deep-red rim: Figma's radial gradient, kept as the SVG fill it exported, over #261f29.
const TILE_FILL = `url("data:image/svg+xml;utf8,<svg viewBox='0 0 32.778 32.778' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(-4.1454e-15 4.837 -2.6238 -3.5766e-15 16.389 -3.642)'><stop stop-color='rgba(0,0,0,0)' offset='0.7073'/><stop stop-color='rgba(71,13,0,0.5)' offset='0.80263'/><stop stop-color='rgba(106,19,0,0.75)' offset='0.8503'/><stop stop-color='rgba(141,26,0,1)' offset='0.89796'/></radialGradient></defs></svg>"), linear-gradient(90deg, #261f29 0%, #261f29 100%)`;

type Icon = ComponentType<SVGProps<SVGSVGElement>>;
const Row = ({ icon: Icon, label, clip }: { icon?: Icon; label: string; clip?: boolean }) =>
  <div className="dash-row"><div className={`dash-menu${clip ? ' dash-clip' : ''}`}>
    <div className={`dash-icon${Icon ? ' dash-icon-dim' : ''}`}>{Icon && <Icon />}</div>
    <div className="dash-label"><p>{label}</p></div>
    <div className="dash-slot" />
  </div></div>;

const RailIcon = ({ icon: Icon }: { icon: Icon }) => <div className="dash-rail-item"><Icon /></div>;

export function Dashboard({ agent }: { agent: AgentValues }) {
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<AgentStatus>('working');
  useDashboardMotion(ref, agent, setStatus);
  // The icon's style and the dot's geometry, as CSS variables the flower's styles read.
  const icon = { '--icon-haze': agent.Icon.glowStrength, '--icon-petal-width': agent.Icon.petalWidth, '--icon-sparkle': agent.Icon.sparkleSize } as CSSProperties;
  return <div ref={ref} className="dash-window" data-node-id="483:23066" aria-label="Company XYZ dashboard, Train › Content selected"><div className="dash-clip">
    <div className="dash-glow" data-node-id="483:23067" aria-hidden="true"><SidebarGlow /></div>
    <div className="dash-panel" data-node-id="483:23068">
      <nav className="dash-sidebar" data-node-id="483:23069" aria-label="Sidebar">
        <div className="dash-header"><div className="dash-header-inner"><div className="dash-menu dash-menu-head" data-node-id="483:23072">
          <div className="dash-tile" data-node-id="483:23073" style={{ backgroundImage: TILE_FILL }} aria-hidden="true">
            <div className="dash-tile-subtract"><TileSubtract /></div>
            <div className="dash-tile-highlight-1"><TileHighlights1 /></div>
            <div className="dash-tile-highlight-2"><TileHighlights2 /></div>
            <div className="dash-tile-rim" />
            <div className="dash-tile-glass" />
            <div className="dash-tile-central" />
            <div className="dash-tile-logo"><TileLogo /></div>
          </div>
          <div className="dash-label dash-label-company"><p>Company XYZ</p></div>
          <div className="dash-slot dash-slot-chevron"><Chevron /></div>
        </div></div></div>
        <div className="dash-nav">
          <div className="dash-nav-items">
            <Row icon={IconAnalyze} label="Analyze" />
            <div className="dash-group" data-node-id="483:23113">
              <Row icon={IconTrain} label="Train" clip />
              <div className="dash-row"><div className="dash-menu dash-menu-sub" data-node-id="483:23130">
                <div className="dash-icon" />
                <div className="dash-pill" data-node-id="483:23132" aria-current="page"><p>Content</p></div>
              </div></div>
              <Row label="Guidance" />
              <Row label="Task" />
              <Row label="Suggestions" />
              <div className="dash-line" data-node-id="483:23160" aria-hidden="true" />
              <div className="dash-indicator" data-node-id="483:23161" aria-hidden="true" />
            </div>
            <Row icon={IconTest} label="Test" />
            <Row icon={IconDeploy} label="Deploy" />
            <Row icon={IconSetting} label="Setting" />
          </div>
          <div className="dash-tutorials" data-node-id="483:23195"><div className="dash-tutorials-box"><div className="dash-tutorials-menu">
            <p className="dash-tutorials-title">Tutorials</p>
            <p className="dash-tutorials-text">Learn how to set up and learn about the feature</p>
          </div></div></div>
        </div>
      </nav>
      <div className="dash-space" data-node-id="483:23238" />
    </div>
    <div className="dash-rail" data-node-id="483:23239" aria-label="Main bar">
      <div className="dash-rail-top">
        <div className="dash-rail-item" data-node-id="483:23241"><div className="dash-rail-frame"><RailLogomark className="dash-logomark" /></div></div>
        <div className="dash-rail-group"><RailIcon icon={RailSparkleSearch} /></div>
        <RailDivider className="dash-rail-divider" data-node-id="483:23260" />
        <div className="dash-rail-group">
          <div className="dash-rail-item" data-node-id="483:23263"><div className="dash-rail-frame"><RailNotification className="dash-notification" /></div></div>
          <div className="dash-rail-item dash-rail-flower" data-node-id="483:23268"><div className="dash-rail-frame"><div className="flower-icon" style={{ transform: `scale(${ICON_SCALE})`, ...icon }}><AgentClock /><FloralDashboard variant="icon" status={status} style={dotStyle(agent.Dot) as CSSProperties} /></div></div></div>
          <RailIcon icon={RailIcon5} />
          <RailIcon icon={RailIcon6} />
          <RailIcon icon={RailIcon7} />
        </div>
      </div>
      <div className="dash-rail-bottom">
        <RailIcon icon={RailBottom1} />
        <RailIcon icon={RailBottom2} />
      </div>
    </div>
  </div></div>;
}
