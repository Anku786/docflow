import { memo, useCallback } from "react";

export const SearchHeader = memo((props) => {
    const handleChange = useCallback((event) => {
        const value = event.target.value;
        props.api.setFilterModel({
            ...props.api.getFilterModel(),
            [props.column.getColId()]: value
                ? {
                    filterType: "text",
                    type: "contains",
                    filter: value,
                }
                : null,
        });
    }, [props.api, props.column]);

    const stopPropagation = useCallback((event) => {
        event.stopPropagation();
    }, []);

    return (
        <div className="custom-header">
            <div className="custom-header-title">
                {props.displayName}
            </div>
            <input
                type="text"
                placeholder="Search..."
                onChange={handleChange}
                onClick={stopPropagation}
            />
        </div>
    );
});
