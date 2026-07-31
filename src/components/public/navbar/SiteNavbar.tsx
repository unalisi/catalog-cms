import { ClassicNavbar } from './ClassicNavbar';
import { FullscreenNavbar } from './FullscreenNavbar';
import { MegaImgNavbar } from './MegaImgNavbar';
import { MegaNavbar } from './MegaNavbar';
import type { SiteNavbarProps } from './types';

export default function SiteNavbar(props: SiteNavbarProps) {
  switch (props.layout) {
    case 'fullscreen':
      return <FullscreenNavbar {...props} />;
    case 'mega':
      return <MegaNavbar {...props} />;
    case 'mega-img':
      return <MegaImgNavbar {...props} />;
    case 'classic':
    default:
      return <ClassicNavbar {...props} />;
  }
}
