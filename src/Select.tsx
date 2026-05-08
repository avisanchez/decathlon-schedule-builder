type T = string | number | readonly string[] | undefined
type Option = {
    value: T,
    display: T
}


function Select({ value, options, onChange }: {
    value: T,
    options: Option[],
    onChange(newValue: T): void
}) {
    return (
        <select
            value={value}
            onChange={(e) => {
                onChange(e.target.value);
            }}
        >
            {
                options.map(opt => {
                    return (
                        <option value={opt.value}>
                            {opt.display}
                        </option>
                    )
                })
            }
        </select>
    )
}

export default Select;