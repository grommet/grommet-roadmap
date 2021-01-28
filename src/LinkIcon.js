import React from 'react';
import { Figma, Github, Link } from 'grommet-icons';

const LinkIcon = ({ url }) => {
  if (url.includes('figma.com')) return <Github />;
  if (url.includes('github.com')) return <Figma color="plain" />;
  return <Link />;
};

export default LinkIcon;
