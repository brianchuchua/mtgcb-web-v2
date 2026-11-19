'use client';

import { useDispatch, useSelector } from 'react-redux';
import ColorFilterBox from '@/features/browse/ColorFilterBox';
import { selectColorIdentity, setColorIdentity } from '@/redux/slices/browse';

const ColorIdentitySelector = () => {
  const dispatch = useDispatch();
  const colorIdentityFilter = useSelector(selectColorIdentity);

  return (
    <ColorFilterBox
      label="Color Identity"
      testId="color-identity-filter"
      value={colorIdentityFilter}
      onChange={(value) => dispatch(setColorIdentity(value))}
    />
  );
};

export default ColorIdentitySelector;
