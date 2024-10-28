import {Dropdown} from 'primereact/dropdown';
import {Checkbox} from '../ui/checkbox';

export function edit({
  columnId,
  settings,
  dropdownOptions,
  value,
  handleChange,
}) {
  return (
    <Checkbox
      id={columnId}
      name={columnId}
      onCheckedChange={(checked) => {
        handleChange(columnId, checked ? 1 : 0);
      }}
      checked={value ? true : false}
    />
  );
}

export function read(props) {
  return <>{props.value ? 'Yes' : 'No'}</>;
}

export function filter({columnId, value, onFilterElementChange, ...props}) {
  return (
    <Dropdown
      value={value}
      optionValue="value"
      optionLabel="label"
      onChange={(e) => {
        onFilterElementChange(columnId, e.value, 'equals');
      }}
      options={[
        {label: 'All', value: ''},
        {label: 'Yes', value: '1'},
        {label: 'No', value: '0'},
      ]}
    />
  );
}

filter.showFilterMenu = false;
filter.showClearButton = false;
