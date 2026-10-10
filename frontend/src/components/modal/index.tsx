import type { JSX } from 'react';

import { createPortal } from 'react-dom';

const ModalPortal = ({ children }: { children: React.ReactNode }): JSX.Element => {
  return createPortal(children, document.getElementById('modal')!);
};

ModalPortal.displayName = 'ModalPortal';

export default ModalPortal;
