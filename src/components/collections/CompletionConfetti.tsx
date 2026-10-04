import Confetti from 'react-confetti';

const CompletionConfetti = ({ show, recycle, onComplete }: CompletionConfettiProps) => {
  if (!show) return null;

  return (
    <Confetti
      style={{ position: 'fixed', height: '100vh', width: '100vw', zIndex: 9999 }}
      gravity={0.1}
      recycle={recycle}
      run={true}
      numberOfPieces={400}
      onConfettiComplete={onComplete}
    />
  );
};

interface CompletionConfettiProps {
  show: boolean;
  recycle: boolean;
  onComplete: () => void;
}

export default CompletionConfetti;
