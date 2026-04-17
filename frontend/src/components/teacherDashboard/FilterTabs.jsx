const FilterTabs = ({ options, value, onChange }) => {
  return (
    <div className="tn-filter-tabs">
      {options.map((option) => (
        <button
          key={option.value}
          className={value === option.value ? "active" : ""}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default FilterTabs;
