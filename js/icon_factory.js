export class IconFactory {
    constructor() {
        this.font = "16px sans";
        this.canvas = null;
    }

    leaflet_icon(text, color) {
        /* global L */
        const icon = this.create_map_icon(text, color);
        return L.icon({
            iconUrl: icon.url,
            iconSize: icon.size,
            iconAnchor: icon.anchor,
        });
    }

    google_icon(text, color) {
        /* global google */
        const icon = this.create_map_icon(text, color);
        return {
            url: icon.url,
            size: new google.maps.Size(icon.size[0], icon.size[1]),
            scaledSize: new google.maps.Size(icon.size[0], icon.size[1]),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(icon.anchor[0], icon.anchor[1]),
        };
    }

    create_map_icon(text, color) {
        const encoder = document.createElement('span');
        encoder.textContent = text;
        const encoded_text = encoder.innerHTML;

        const
            w = Math.max(33.0, 16.0 + this.compute_text_width(text, this.font)),
            w2 = 0.5 * w,
            text_color = color.text_color().to_hash_string(),
            svg = `<svg\n
                       xmlns:svg="http://www.w3.org/2000/svg"\n
                       xmlns="http://www.w3.org/2000/svg"\n
                       width="${w}" height="37"\n
                       viewBox="0 0 ${w} 37"\n
                       version="1.1">\n
                     <defs>\n
                       <filter id="shadow" x="0" y="0" width="100%" height="100%">\n
                         <feOffset result="offOut" in="SourceAlpha" dx="1" dy="1" />\n
                         <feGaussianBlur result="blurOut" in="offOut" stdDeviation="2" />\n
                         <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />\n
                       </filter>\n
                     </defs>\n
                       <path\n
                         fill="${color.to_hash_string()}" stroke="#000000"\n
                         d="M 4 4 L 4 26 L ${w2 - 4.0} 26 L ${w2} 33 L ${w2 + 4.0} 26 L ${w - 4.0} 26 L ${w - 4.0} 4 L 4 4 z"\n
                         filter="url(#shadow)" />\n
                       <text\n
                         style="text-anchor:middle;font-family:Arial,Helvetica,sans-serif;font-style:normal;font-weight:normal;font-size:16px;line-height:100%;font-family:sans;letter-spacing:0px;word-spacing:0px;fill:${text_color};fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"\n
                         x="${w2}" y="21">${encoded_text}</text>\n
                   </svg>`,
            url = `data:image/svg+xml;charset=UTF-8;base64,${window.btoa(svg)}`;

        return {
            url: url,
            size: [w, 37],
            anchor: [w2, 37 - 4.0],
        };
    }

    compute_text_width(text) {
        // re-use canvas object for better performance
        if (!this.canvas) {
            this.canvas = document.createElement("canvas");
        }

        const context = this.canvas.getContext("2d");
        context.font = this.font;

        return context.measureText(text).width;
    }
}
