// static/js/excalidraw.js

let excalidrawAPI = null;
const excalidrawContainer = document.getElementById('excalidraw-container');
const saveDiagramBtn = document.getElementById('save-diagram-btn');

export const getExcalidrawAPI = () => excalidrawAPI;

export const mountExcalidraw = (initialData) => {
    ReactDOM.unmountComponentAtNode(excalidrawContainer);
    excalidrawAPI = null;
    saveDiagramBtn.disabled = true;

    setTimeout(() => {
        const excalidrawElement = React.createElement(ExcalidrawLib.Excalidraw, {
            ref: (api) => {
                if (api) {
                    excalidrawAPI = api;
                    saveDiagramBtn.disabled = false;
                }
            },
            initialData: initialData,
            renderTopRightUI: () => null
        });
        ReactDOM.render(excalidrawElement, excalidrawContainer);
    }, 0);
};