document.addEventListener('DOMContentLoaded', function() {
    const imageMap = document.getElementById('image-map');
    const image = imageMap ? imageMap.previousElementSibling : null; // Assuming image is before map
    const overlayContainer = document.getElementById('area-overlays');
    const areas = document.querySelectorAll('#image-map area');
    const customTooltip = document.getElementById('custom-imagemap-tooltip');
    let hideTooltipTimeout; // To manage the delay for hiding
    const overlays = {}; // To store the created overlay elements

    // Store original image dimensions
    let originalImageWidth;
    let originalImageHeight;

    if (!imageMap || !image || !overlayContainer || !customTooltip) {
        console.error("One or more required elements (image-map, image, area-overlays, custom-imagemap-tooltip) not found in the DOM.");
        return;
    }

    // Capture original image dimensions once it's loaded
    if (image.complete) {
        originalImageWidth = image.naturalWidth;
        originalImageHeight = image.naturalHeight;
    } else {
        image.addEventListener('load', () => {
            originalImageWidth = image.naturalWidth;
            originalImageHeight = image.naturalHeight;
            // Call resizeMap here too, in case image loads after DOMContentLoaded
            resizeMap();
        });
    }

    // Function to create an overlay element based on area attributes
    function createOverlay(area) {
        const overlay = document.createElement('div');
        overlay.classList.add('area-overlay');
        overlay.dataset.areaId = area.dataset.areaId; // Link overlay to area

        // Store original coordinates
        area.dataset.originalCoords = area.getAttribute('coords');
        area.dataset.originalShape = area.getAttribute('shape'); // Also store original shape for poly calculations

        overlayContainer.appendChild(overlay);
        overlays[area.dataset.areaId] = overlay;
    }

    // Create overlays for each area initially
    areas.forEach(createOverlay);

    // Function to resize the map areas and their overlays
    function resizeMap() {
        if (!originalImageWidth || !originalImageHeight) {
            console.warn("Original image dimensions not available yet. Skipping resizeMap.");
            return;
        }

        const currentImageWidth = image.clientWidth;
        const currentImageHeight = image.clientHeight;

        const scaleX = currentImageWidth / originalImageWidth;
        const scaleY = currentImageHeight / originalImageHeight;

        areas.forEach(area => {
            const originalCoords = area.dataset.originalCoords.split(',').map(Number); // Convert to numbers
            const originalShape = area.dataset.originalShape.toLowerCase();
            const overlay = overlays[area.dataset.areaId];

            if (!overlay) return; // Should not happen if createOverlay ran correctly

            const scaledCoords = originalCoords.map((coord, index) => {
                // Scale x-coordinates (even indices) by scaleX, y-coordinates (odd indices) by scaleY
                return Math.round(coord * (index % 2 === 0 ? scaleX : scaleY));
            });

            // Update the area's coords attribute
            area.setAttribute('coords', scaledCoords.join(','));

            // Update the overlay's style based on the scaled coordinates
            switch (originalShape) { // Use original shape to determine how to calculate
                case 'rect':
                    overlay.style.left = `${scaledCoords[0]}px`;
                    overlay.style.top = `${scaledCoords[1]}px`;
                    overlay.style.width = `${scaledCoords[2] - scaledCoords[0]}px`;
                    overlay.style.height = `${scaledCoords[3] - scaledCoords[1]}px`;
                    break;
                case 'circle':
                    const centerX = scaledCoords[0];
                    const centerY = scaledCoords[1];
                    const radius = scaledCoords[2];
                    overlay.style.left = `${centerX - radius}px`;
                    overlay.style.top = `${centerY - radius}px`;
                    overlay.style.width = `${2 * radius}px`;
                    overlay.style.height = `${2 * radius}px`;
                    overlay.style.borderRadius = '50%';
                    break;
                case 'poly':
                    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                    for (let i = 0; i < scaledCoords.length; i += 2) {
                        const x = scaledCoords[i];
                        const y = scaledCoords[i + 1];
                        minX = Math.min(minX, x);
                        maxX = Math.max(maxX, x);
                        minY = Math.min(minY, y);
                        maxY = Math.max(maxY, y);
                    }
                    overlay.style.left = `${minX}px`;
                    overlay.style.top = `${minY}px`;
                    overlay.style.width = `${maxX - minX}px`;
                    overlay.style.height = `${maxY - minY}px`;
                    // For polygons, you might also need to use clip-path if you want the overlay to perfectly match the poly shape.
                    // This example uses a bounding box for simplicity.
                    break;
            }
        });

        // Ensure overlay container size matches the image size
        updateOverlayContainerSize();
    }

    // Event listeners for mouseover and mouseout on the image map areas (for border and tooltip)
    areas.forEach(area => {
        area.addEventListener('mouseover', (e) => {
            // --- Tooltip on mouseover ---
            clearTimeout(hideTooltipTimeout);
            const tooltipText = area.dataset.tooltip;
            if (tooltipText) {
                customTooltip.textContent = tooltipText;
                customTooltip.style.left = `${e.pageX + 10}px`;
                customTooltip.style.top = `${e.pageY + 10}px`;
                setTimeout(() => {
                    customTooltip.style.opacity = '1';
                    customTooltip.style.visibility = 'visible';
                }, 50);
            }

            // --- Border on mouseover ---
            if (overlays[area.dataset.areaId]) {
                overlays[area.dataset.areaId].classList.add('hovered');
            }
        });

        area.addEventListener('mousemove', (e) => {
            // --- Tooltip follow mouse ---
            customTooltip.style.left = `${e.pageX + 10}px`;
            customTooltip.style.top = `${e.pageY + 10}px`;
        });

        area.addEventListener('mouseout', () => {
            // --- Tooltip on mouseout ---
            hideTooltipTimeout = setTimeout(() => {
                customTooltip.style.opacity = '0';
                customTooltip.style.visibility = 'hidden';
                customTooltip.textContent = '';
            }, 200);

            // --- Border on mouseout ---
            if (overlays[area.dataset.areaId]) {
                overlays[area.dataset.areaId].classList.remove('hovered');
            }
        });
    });

    // Ensure overlay container size matches the image size
    function updateOverlayContainerSize() {
        overlayContainer.style.width = `${image.offsetWidth}px`;
        overlayContainer.style.height = `${image.offsetHeight}px`;
    }

    // Initial setup
    updateOverlayContainerSize();
    resizeMap(); // Call resizeMap initially after elements are set up

    // Update size on window resize
    window.addEventListener('resize', () => {
        updateOverlayContainerSize(); // Update container size first
        resizeMap(); // Then resize the map areas
    });
});
