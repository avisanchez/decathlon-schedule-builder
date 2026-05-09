import { useEffect, useRef, useState } from "react";

// Credit: Gemini (refactor original component)
function SplitLayout({ hidePanel, mainContent, panelContent }: {
    mainContent: React.ReactNode,
    panelContent: React.ReactNode,
    hidePanel: boolean
}) {
    const minPanelHeight = 100; // px
    const defaultPanelHeight = 250; // px
    const dragbarHeight = 7;   // px

    const [panelHeight, setPanelHeight] = useState(defaultPanelHeight);

    /**
     * Drag interaction state that should NOT trigger rerenders.
     */
    const dragRef = useRef({
        isDragging: false,
        startY: 0,
        startHeight: defaultPanelHeight
    });

    const splitLayoutRef = useRef<HTMLDivElement>(null);

    useEffect(() => {

        const mouseUpHandler = () => {
            dragRef.current.isDragging = false;
        };

        const mouseMoveHandler = (e: MouseEvent) => {
            if (!dragRef.current.isDragging) {
                return;
            }

            const delta =
                dragRef.current.startY - e.clientY;

            const containerHeight =
                splitLayoutRef.current?.clientHeight ?? 0;

            const nextHeight =
                dragRef.current.startHeight + delta;

            setPanelHeight(
                Math.min(
                    containerHeight - dragbarHeight,
                    Math.max(minPanelHeight, nextHeight)
                )
            );
        };

        const mouseLeaveHandler = () => {
            dragRef.current.isDragging = false;
        };

        document.addEventListener("mouseup", mouseUpHandler);
        document.addEventListener("mousemove", mouseMoveHandler);
        document.addEventListener("mouseleave", mouseLeaveHandler);

        return () => {
            document.removeEventListener("mouseup", mouseUpHandler);
            document.removeEventListener("mousemove", mouseMoveHandler);
            document.removeEventListener("mouseleave", mouseLeaveHandler);
        };
    }, []);

    return (

        <>
            {/* Remaining space */}
            < div
                ref={splitLayoutRef}
                style={{
                    flex: 1,
                    // debug
                    // backgroundColor: "lightgreen",
                }
                }
            >
                {/* main area */}
                < div
                    style={{
                        height: "100%",
                        boxSizing: "border-box",
                        position: "relative"
                        // debug
                        // backgroundColor: "red",
                        // border: "3px solid purple",
                    }}
                >
                    {mainContent}

                    {/* Panel */}
                    <div
                        style={{
                            position: "absolute",
                            bottom: 0,
                            width: "100%",
                            minHeight: `${minPanelHeight}px`,
                            height: panelHeight,
                            backgroundColor: "white",
                            overflow: "hidden"
                            // debug
                            // backgroundColor: "orange",
                            // border: "1px solid blue"
                        }}
                        hidden={hidePanel}
                    >
                        {/* Dragbar */}
                        <div
                            style={{
                                width: "100%",
                                height: dragbarHeight,
                                backgroundColor: "rgb(220, 220, 220)",
                                cursor: "ns-resize"
                                // debug
                                // backgroundColor: "green",
                            }}
                            onMouseDown={(e) => {
                                dragRef.current = {
                                    isDragging: true,
                                    startY: e.clientY,
                                    startHeight: panelHeight
                                };
                            }}
                        />
                        {panelContent}
                    </div>
                </div >
            </div >
        </>
    );
}

export default SplitLayout;