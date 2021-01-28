import React from 'react';
import { Figma, Github, Link } from 'grommet-icons';

const LinkIcon = ({ url }) => {
  if (url.includes('figma.com')) return <Figma color="plain" />;
  if (url.includes('github.com')) return <Github />;
  return <Link />;
};

export default LinkIcon;
