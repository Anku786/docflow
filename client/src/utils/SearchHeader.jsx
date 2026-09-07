export const SearchHeader = (props) => {
    const handleChange = (event) => {
        props.api.setFilterModel({
            ...props.api.getFilterModel(),
            [props.column.getColId()]: event.target.value
                ? {
                    filterType: 'text',
                    type: 'contains',
                    filter: event.target.value,
                }
                : null,
        });
    };

    return (
        <div className="custom-header">
            <div className="custom-header-title">
                {props.displayName}
            </div>

            <input
                type="text"
                placeholder="Search..."
                onChange={handleChange}
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
};