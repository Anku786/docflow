const Loader = ({ isActive, children, text = "Loading..." }) => {
    return (
        <>
            {children}
            {isActive && (
                <div className="loader-overlay">
                    <div className="loader-spinner" />
                    <span>{text}</span>
                </div>
            )}
        </>
    );
};

export default Loader;