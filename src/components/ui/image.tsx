import React from 'react';
import { cn } from '@/lib/utils';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  ({ className, alt, ...props }, ref) => {
    return (
      <img
        className={cn('inline-block', className)}
        alt={alt || ''}
        ref={ref}
        {...props}
      />
    );
  }
);

Image.displayName = 'Image';

export default Image;
