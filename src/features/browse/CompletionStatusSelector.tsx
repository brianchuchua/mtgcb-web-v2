'use client';

import { useDispatch, useSelector } from 'react-redux';
import AutocompleteWithNegation, { Option } from '@/components/ui/AutocompleteWithNegation';
import { selectCompletionStatus, setCompletionStatus } from '@/redux/slices/browseSlice';

const COMPLETION_STATUS_MAP = [
  { name: 'Complete (100%)', value: 'complete' },
  { name: 'Partial (1-99%)', value: 'partial' },
  { name: 'Empty (0%)', value: 'empty' },
];

const CompletionStatusSelector = () => {
  const dispatch = useDispatch();
  const selectedCompletionStatus = useSelector(selectCompletionStatus);

  const mappedStatuses: Option[] = COMPLETION_STATUS_MAP.map((status) => ({
    category: 'Completion Status',
    label: status.name,
    value: status.value,
    exclude: false,
  }));

  const selectedOptions = selectedCompletionStatus
    ? [
        ...selectedCompletionStatus.include.map((statusValue) => ({
          category: 'Completion Status',
          label: COMPLETION_STATUS_MAP.find((s) => s.value === statusValue)?.name || 'Unknown',
          value: statusValue,
          exclude: false,
        })),
        ...selectedCompletionStatus.exclude.map((statusValue) => ({
          category: 'Completion Status',
          label: COMPLETION_STATUS_MAP.find((s) => s.value === statusValue)?.name || 'Unknown',
          value: statusValue,
          exclude: true,
        })),
      ]
    : [];

  const handleStatusChange = (selectedStatuses: Option[]) => {
    const statusFilter = {
      include: selectedStatuses.filter((status) => !status.exclude).map((status) => status.value),
      exclude: selectedStatuses.filter((status) => status.exclude).map((status) => status.value),
    };

    dispatch(setCompletionStatus(statusFilter));
  };

  return (
    <AutocompleteWithNegation
      label="Completion Status"
      options={mappedStatuses}
      selectedOptions={selectedOptions}
      setSelectedOptionsRemotely={handleStatusChange}
    />
  );
};

export default CompletionStatusSelector;