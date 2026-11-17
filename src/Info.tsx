import './info.css';
import {colors} from 'tinywidgets/css';
import type {CSSProperties} from 'react';

export const Info = () => (
  <div id="info" style={infoStyle}>
    <div id="infoTech">
      <img
        src="/ts.svg"
        className="infoTechIcon"
        title="Written in TypeScript"
      />
      <img src="/react.svg" className="infoTechIcon" title="Built with React" />
      <img
        src="/tinywidgets.svg"
        className="infoTechIcon"
        title="Uses TinyWidgets components"
      />
    </div>
    <div id="infoIcon">
      i
      <div id="infoTooltip">
        {
          "A simple todo list application demonstrating TinyBase's reactive data management with CRUD operations."
        }
      </div>
    </div>
  </div>
);

const infoStyle = {
  '--info-fg': colors.foreground,
  '--info-fg2': colors.foregroundDim,
  '--info-bg2': colors.background2,
  '--info-border': colors.borderColor,
  '--info-accent': colors.accent,
} as CSSProperties;
