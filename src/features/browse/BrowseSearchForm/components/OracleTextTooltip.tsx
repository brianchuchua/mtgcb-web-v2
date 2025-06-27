import React from 'react';

const OracleTextTooltip: React.FC = () => (
  <>
    <div>The following special symbols are supported:</div>
    <ul style={{ margin: '8px 0', paddingInlineStart: '20px' }}>
      <li>{`{T} – tap symbol`}</li>
      <li>{`{Q} – untap symbol`}</li>
      <li>{`{W} – white mana`}</li>
      <li>{`{U} – blue mana`}</li>
      <li>{`{B} – black mana`}</li>
      <li>{`{R} – red mana`}</li>
      <li>{`{G} – green mana`}</li>
      <li>{`{C} – colorless mana`}</li>
      <li>{`{X} – X generic mana`}</li>
      <li>{`{0} – zero mana`}</li>
      <li>{`{1} – one generic mana`}</li>
      <li>{`{2} – two generic mana`}</li>
      <li>{`{S} – snow mana`}</li>
      <li>{`{E} – energy symbol`}</li>
    </ul>
  </>
);

export default OracleTextTooltip;