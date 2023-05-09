import { BaseMapType } from "../types";
import t from "src/l10n/locale";
import { Marker } from "src/layer";
import { LeafletSymbol } from "src/utils/leaflet-import";
import { BaseDrawControl } from "./base";
import { DrawControl } from "./controls";
import { Shape } from "./shape";
import { Vertex } from "./vertex";

const L = window[LeafletSymbol];

export class Polygon extends Shape<L.Polygon> {
    popup: null;

    extensions = {
        forward: {
            line: L.polyline([], {
                ...this.options,
                dashArray: "5,10",
                weight: 1,
                interactive: false,
                color: this.controller.color
            }),
            added: false
        },
        backward: {
            line: L.polyline([], {
                ...this.options,
                dashArray: "5,10",
                weight: 1,
                interactive: false,
                color: this.controller.color
            }),
            added: false
        }
    };
    leafletInstance = L.polygon([], this.options).addTo(
        this.map.leafletInstance
    );
    get canSave() {
        return this.vertices.length >= 3;
    }
    hideExtensions() {
        this.extensions.forward.line.remove();
        this.extensions.forward.added = false;
        this.extensions.backward.line.remove();
        this.extensions.backward.added = false;
    }

    _onClick(
        evt: L.LeafletMouseEvent,
        targets?: {
            marker?: Marker;
            vertices?: Vertex[];
        }
    ) {
        this.vertices.push(
            new Vertex(this.mouseLoc ?? evt.latlng, this, targets)
        );
        this.redraw();
    }

    _onMousemove(latlng: L.LatLng, modifier: boolean) {
        if (this.vertices.length) {
            this.mouseLoc = this.getMousemoveDelta(latlng, null, modifier);
            this.showExtensions(this.mouseLoc);
        }
    }

    redraw() {
        this.leafletInstance.setLatLngs(this.latlngs);
        this.leafletInstance.redraw();
        this.showExtensions(this.latlngs[this.vertices.length - 1]);
    }

    showExtensions(latlng: L.LatLng) {
        if (this.vertices.length >= 1) {
            this.extensions.forward.line.setLatLngs([
                this.latlngs[this.vertices.length - 1],
                latlng
            ]);
            if (this.extensions.forward.added) {
                this.extensions.forward.line.redraw();
            } else {
                this.extensions.forward.line.addTo(this.map.leafletInstance);
                this.extensions.forward.added = true;
            }
        }
        if (this.vertices.length > 1) {
            this.extensions.backward.line.setLatLngs([this.latlngs[0], latlng]);
            if (this.extensions.backward.added) {
                this.extensions.backward.line.redraw();
            } else {
                this.extensions.backward.line.addTo(this.map.leafletInstance);
                this.extensions.backward.added = true;
            }
        }
    }

    stopDrawing() {
        this.extensions.forward.line.remove();
        this.extensions.backward.line.remove();
        if (this.vertices.length < 3) {
            this.remove();
        }
    }

    undo() {
        this.vertices.pop();

        this.hideExtensions();
        this.redraw();
    }

    newInstance() {
        this.stopDrawing();
        return new Polygon(this.controller);
    }  

    initialize() {
        this.hideVertices();
        this.redraw();
    }

    type = "polygon";
}

export class PolygonControl extends BaseDrawControl {
    constructor(public parent: DrawControl) {
        super(
            {
                icon: "draw-polygon",
                cls: "leaflet-control-has-actions leaflet-control-draw-polygon",
                tooltip: t("Polygon")
            },
            parent
        );
    }
    draw() {
        this.actionsEl.appendChild(this.complete.controlEl);
        this.actionsEl.appendChild(this.undo.controlEl);
        this.actionsEl.appendChild(this.cancel.controlEl);
    }
    onClick() {
        this.parent.stopDrawingContext();
        this.openActions();
        this.controller.newShape(new Polygon(this.controller));
    }
}
