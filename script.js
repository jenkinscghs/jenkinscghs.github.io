document.addEventListener('DOMContentLoaded', function() {
  const imageMap = document.getElementById('image-map');
  const image = imageMap ? imageMap.previousElementSibling : null; // Assuming image is before map
  const overlayContainer = document.getElementById('area-overlays');
  const areas = document.querySelectorAll('#image-map area');
  const customTooltip = document.getElementById('custom-imagemap-tooltip');
  let hideTooltipTimeout; // To manage the delay for hiding
  const overlays = {}; // To store the created overlay elements

  if (!imageMap || !image || !overlayContainer || !customTooltip) {
    console.error("One or more required elements (image-map, image, area-overlays, custom-imagemap-tooltip) not found in the DOM.");
    return;
  }

  // Function to create an overlay element based on area attributes
  function createOverlay(area) {
    const overlay = document.createElement('div');
    overlay.classList.add('area-overlay');
    overlay.dataset.areaId = area.dataset.areaId; // Link overlay to area

    const coords = area.coords.split(',');
    const shape = area.shape.toLowerCase();

    switch (shape) {
      case 'rect':
        overlay.style.left = `${coords[0]}px`;
        overlay.style.top = `${coords[1]}px`;
        overlay.style.width = `${coords[2] - coords[0]}px`;
        overlay.style.height = `${coords[3] - coords[1]}px`;
        break;
      case 'circle':
        const centerX = parseInt(coords[0]);
        const centerY = parseInt(coords[1]);
        const radius = parseInt(coords[2]);
        overlay.style.left = `${centerX - radius}px`;
        overlay.style.top = `${centerY - radius}px`;
        overlay.style.width = `${2 * radius}px`;
        overlay.style.height = `${2 * radius}px`;
        overlay.style.borderRadius = '50%';
        break;
      case 'poly':
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (let i = 0; i < coords.length; i += 2) {
          const x = parseInt(coords[i]);
          const y = parseInt(coords[i + 1]);
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
        overlay.style.left = `${minX}px`;
        overlay.style.top = `${minY}px`;
        overlay.style.width = `${maxX - minX}px`;
        overlay.style.height = `${maxY - minY}px`;
        break;
    }

    overlayContainer.appendChild(overlay);
    overlays[area.dataset.areaId] = overlay;
  }

  // Create overlays for each area
  areas.forEach(createOverlay);

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

  // Update size on initial load and window resize
  if (image) {
    updateOverlayContainerSize();
    window.addEventListener('resize', updateOverlayContainerSize);
  }
});
