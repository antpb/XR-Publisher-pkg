import { FC } from 'react';

interface NetworkingProps {
  postSlug?: string;
  userData: {
    inWorldName: string;
    playerVRM: string;
    profileImage: string;
    nonce?: string;
    [key: string]: any;
  };
  networkingBlock: HTMLElement[];
}

declare const Networking: FC<NetworkingProps>;
export default Networking;