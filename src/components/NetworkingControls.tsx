import React from 'react';
import type { FC, ReactElement } from 'react';
import { XRButton } from '@react-three/xr';

interface NetworkingControlsProps {
  networkingBlock: HTMLElement[];
  postSlug?: string;
  userData: {
    inWorldName: string;
    playerVRM: string;
    profileImage: string;
    [key: string]: any;
  };
  hmdIcon: string;
}

export const NetworkingControls: FC<NetworkingControlsProps> = ({
  networkingBlock,
  postSlug,
  userData,
  hmdIcon
}): ReactElement => (
  <div 
    id="networking" 
    style={{ display: "none" }} 
    className="xr-publisher-networking-controls"
  >
    <div id="messages" style={{ display: "none" }} />
    <div id="network-ui-container" style={{ display: "flex" }}>
      <XRButton
        mode="VR"
        sessionInit={{
          optionalFeatures: [
            'local-floor',
            'bounded-floor',
            'hand-tracking',
            'layers'
          ]
        }}
      >
        <img
          src={hmdIcon}
          alt="Enter VR"
          style={{
            maxWidth: "40px",
            marginLeft: "-10.5px",
            marginTop: "-11px"
          }}
        />
      </XRButton>
      {Boolean(networkingBlock?.length) && (
        <button className="button" id="audio-button" type="button">
          <span style={{ fontSize: "0.6em", display: "block" }}>JOIN</span>
          <span>VOICE</span>
        </button>
      )}
    </div>
    <div id="room-dropdown" />
    <div id="videos" />
  </div>
);