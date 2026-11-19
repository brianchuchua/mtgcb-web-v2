'use client';

import { useDispatch, useSelector } from 'react-redux';
import ColorFilterBox from '@/features/browse/ColorFilterBox';
import { selectColors, setColors } from '@/redux/slices/browse';

const ColorSelector = () => {
  const dispatch = useDispatch();
  const colorFilter = useSelector(selectColors);

  return (
    <ColorFilterBox
      label="Colors"
      testId="color-filter"
      value={colorFilter}
      onChange={(value) => dispatch(setColors(value))}
    />
  );
};

export default ColorSelector;
