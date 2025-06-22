document.addEventListener('DOMContentLoaded', function() {
 
  // Loading indicator
  if (!document.getElementById('loading')) {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading';
    loadingDiv.style.display = 'none';
    loadingDiv.style.textAlign = 'center';
    loadingDiv.style.padding = '20px';
    loadingDiv.innerHTML = 'Loading graph data...';
    document.body.appendChild(loadingDiv);
  }

  loadGraphData('data.json');

  function loadGraphData(jsonFile) {
    // Show loading indicator
    const loadingElement = document.getElementById('loading');
    const cyElement = document.getElementById('cy');
    
    if (loadingElement) loadingElement.style.display = 'block';
    if (cyElement) cyElement.style.display = 'none';
    
    fetch(jsonFile)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok: ' + response.statusText);
        }
        return response.json();
      })
      .then(graphData => {
        // Hide loading indicator
        if (loadingElement) loadingElement.style.display = 'none';
        if (cyElement) cyElement.style.display = 'block';
        
        if (window.cy) {
          try {
            // Try using destroy if it exists
            if (typeof window.cy.destroy === 'function') {
              window.cy.destroy();
            } else {
              const container = document.getElementById('cy');
              if (container) {
                while (container.firstChild) {
                  container.removeChild(container.firstChild);
                }
              }
            }
          } catch (e) {
            console.warn('Could not properly clean up previous graph:', e);
            // Ensure the container is empty
            const container = document.getElementById('cy');
            if (container) {
              container.innerHTML = '';
            }
          }
        }
        
        initializeGraph(graphData);
      })
      .catch(error => {
        console.error('Error loading graph data:', error);
        if (loadingElement) loadingElement.style.display = 'none';
        if (cyElement) {
          cyElement.innerHTML = 
            '<div style="color: red; padding: 20px;">Error loading graph data. Check console for details.</div>';
          cyElement.style.display = 'block';
        }
      });
  }

  function initializeGraph(graphData) {
    // Initialize Cytoscape
    window.cy = cytoscape({
      container: document.getElementById('cy'),
      elements: [...graphData.nodes, ...graphData.edges],
      style: [
        {
          selector: 'node',
          style: {
            'label': function(ele) {
              // Manual line breaking function
              const label = ele.data('label');
              if (!label) return '';
              
              // Break every 10-15 characters or at spaces
              const words = label.split(' ');
              let lines = [];
              let currentLine = '';
              
              for (let word of words) {
                if (currentLine.length + word.length > 10) { 
                  lines.push(currentLine);
                  currentLine = word;
                } else {
                  currentLine += (currentLine ? ' ' : '') + word;
                }
              }
              if (currentLine) lines.push(currentLine);
              
              return lines.join('\n');
            },
            'text-valign': 'center',
            'text-halign': 'center',
            'background-color': '#666',
            'color': '#000',
            'font-size': 5,
            'text-wrap': 'wrap',
            'text-max-width': 60,
            'text-overflow-wrap': 'whitespace',
            'text-background-color': '#fff',
            'text-background-opacity': 0.7,
            'text-background-padding': 2,
            'text-background-shape': 'roundrectangle',
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 1,
            'line-color': '#999',
            'target-arrow-color': '#999',
            'target-arrow-shape': 'chevron',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': 5,
            'text-rotation': 'autorotate',
            'text-background-color': '#fff',
            'text-background-opacity': 0.7,
            'text-background-padding': 2
          }
        },
        {
          selector: '.highlighted',
          style: {
            'background-color': '#ff7f00',
            'text-outline-color': '#ff7f00',
            'color': '#000',
            'z-index': 20,
            'transition-property': 'background-color, text-outline-color',
            'transition-duration': '0.5s'
          }
        },
        {
          selector: '.connected',
          style: {
            'background-color': '#b58b2b',
            'text-outline-color': '#b58b2b',
            'color': '#000',
            'z-index': 10,
            'transition-property': 'background-color, text-outline-color',
            'transition-duration': '0.5s'
          }
        },
        {
          selector: '.reachable',
          style: {
            'background-color': '#5c7148',
            'text-outline-color': '#5c7148',
            'color': '#000',
            'z-index': 10,
            'transition-property': 'background-color, text-outline-color',
            'transition-duration': '0.5s'
          }
        },
        {
          selector: '.highlighted-edge',
          style: {
            'line-color': '#ff7f00',
            'color': '#ff7f00',
            'font-weight': 'bold',
            'target-arrow-color': '#ff7f00',
            'width': 2,
            'transition-property': 'line-color, target-arrow-color, width',
            'transition-duration': '0.5s',
            'z-index': 9999 
          }
        },
        {
          selector: '.connected-edge',
          style: {
            'line-color': '#ff7f00',
            'color': '#ff7f00',
            'target-arrow-color': '#ff7f00',
            'font-weight': 'bold',
            'width': 2,
            'z-index': 15,
            'transition-property': 'line-color, target-arrow-color, width',
            'transition-duration': '0.5s'
          }
        },
        {
          selector: '.reachable-edge',
          style: {
            'line-color': '#5ba316',
            'color': '#5ba316',
            'font-weight': 'bold',
            'target-arrow-color': '#5ba316',
            'width': 2,
            'z-index': 10,
            'transition-property': 'line-color, target-arrow-color, width',
            'transition-duration': '0.5s'
          }
        },
        {
          selector: '.faded',
          style: {
            'opacity': 0.2,
            'z-index': 1,
            'transition-property': 'opacity',
            'transition-duration': '0.5s'
          }
        }
      ],
      layout: {
        name: 'cose-bilkent',
        animate: true,
        randomize: true,
        nodeDimensionsIncludeLabels: true,
        nodeRepulsion: 8000,
        idealEdgeLength: 100,
        edgeElasticity: 0.45,
        nestingFactor: 0.1,
        gravity: 0.25,
        numIter: 2500,
        tile: true,
        tilingPaddingVertical: 10,
        tilingPaddingHorizontal: 10,
        gravityRangeCompound: 1.5,
        gravityCompound: 1.0,
        gravityRange: 3.8,
        initialEnergyOnIncremental: 0.5
      }
    });

    // Initialize global variables after cy is ready
    window.hiddenNodes = cy.collection();
    window.currentTypeFilter = [];
    window.reportData = null;
    
    // Styles based on types 
    const nodeStyles = {
      'Company': { 'background-color': '#66ddff', 'shape': 'round-hexagon' },
      'Product': { 'background-color': '#66aaff', 'shape': 'ellipse' },
      'Investor': { 'background-color': '#ff6666', 'shape': 'round-rectangle' },
      'UseCase': { 'background-color': '#a126c6', 'shape': 'round-pentagon' },
      'Protocol': { 'background-color': '#616a6b', 'shape': 'round-triangle' },
      'Service': { 'background-color': '#f39c12', 'shape': 'round-octagon' },
    };
    
    // Apply node styles based on type
    graphData.nodes.forEach(node => {
      if (nodeStyles[node.data.type]) {
        cy.style().selector(`#${node.data.id}`).style(nodeStyles[node.data.type]).update();
      }
    });

    // Set up event handlers after graph is initialized
    setupEventHandlers();
  }

  function setupEventHandlers() {
    // Function to set active filter button
    function setActiveFilterButton(buttonId) {
      // Remove active class from all filter buttons
      document.querySelectorAll('.filters button').forEach(btn => {
        btn.classList.remove('active-filter');
      });
      
      // Add active class to the selected button
      if (buttonId) {
        const activeButton = document.getElementById(buttonId);
        if (activeButton) {
          activeButton.classList.add('active-filter');
        }
      }
    }

    // Update depth value display
    const maxDepthElement = document.getElementById('maxDepth');
    if (maxDepthElement) {
      maxDepthElement.addEventListener('input', function() {
        const depthValueElement = document.getElementById('depthValue');
        if (depthValueElement) {
          depthValueElement.textContent = this.value;
        }
        performSearch(); // Re-run search with new depth
      });
    }

    // Add controls functionality
    const fitButton = document.getElementById('fit');
    if (fitButton) {
      fitButton.addEventListener('click', () => {
        cy.fit();
      });
    }
    
    const layoutButton = document.getElementById('layout');
    if (layoutButton) {
      layoutButton.addEventListener('click', () => {
        cy.layout({ name: 'cose-bilkent' }).run();
      });
    }
    
    const searchInput = document.getElementById('search');
    if (searchInput) {
      searchInput.addEventListener('input', performSearch);
    }
    
    const includeConnectedCheckbox = document.getElementById('includeConnected');
    if (includeConnectedCheckbox) {
      includeConnectedCheckbox.addEventListener('change', performSearch);
    }
    
    const includeReachableCheckbox = document.getElementById('includeReachable');
    if (includeReachableCheckbox) {
      includeReachableCheckbox.addEventListener('change', performSearch);
    }
    
    const clearSearchButton = document.getElementById('clearSearch');
    if (clearSearchButton) {
      clearSearchButton.addEventListener('click', () => {
        // Restore any hidden nodes before clearing
        if (window.hiddenNodes && window.hiddenNodes.length > 0) {
          cy.add(window.hiddenNodes);
          window.hiddenNodes = cy.collection(); // Clear the hidden nodes collection
        }
        
        const searchElement = document.getElementById('search');
        if (searchElement) {
          searchElement.value = '';
        }
        
        // Clear all styles
        cy.elements().removeClass('highlighted connected reachable highlighted-edge connected-edge reachable-edge faded');
        
        // Reset hide button
        resetHideButton();
        
        // Fit view
        cy.fit();
        
        showSuccessNotification('Search cleared.');
      });
    }

    // NEW EVENT HANDLERS FOR NEW FEATURES
    const hideFadedButton = document.getElementById('hideFadedNodes');
    if (hideFadedButton) {
      hideFadedButton.addEventListener('click', hideFadedNodes);
    }

    const applyTypeFilterButton = document.getElementById('applyTypeFilter');
    if (applyTypeFilterButton) {
      applyTypeFilterButton.addEventListener('click', applyMultiTypeFilter);
    }

    const clearTypeFilterButton = document.getElementById('clearTypeFilter');
    if (clearTypeFilterButton) {
      clearTypeFilterButton.addEventListener('click', clearMultiTypeFilter);
    }

    const generateReportButton = document.getElementById('generateReport');
    if (generateReportButton) {
      generateReportButton.addEventListener('click', generateUseCaseReport);
    }

    // Report modal event handlers
    const closeReportModalButton = document.getElementById('close-report-modal');
    if (closeReportModalButton) {
      closeReportModalButton.addEventListener('click', () => {
        const modal = document.getElementById('report-modal');
        if (modal) {
          modal.style.display = 'none';
        }
      });
    }

    const exportJSONButton = document.getElementById('exportJSON');
    if (exportJSONButton) {
      exportJSONButton.addEventListener('click', () => exportReport('json'));
    }

    const exportCSVButton = document.getElementById('exportCSV');
    if (exportCSVButton) {
      exportCSVButton.addEventListener('click', () => exportReport('csv'));
    }

    // Close report modal when clicking outside
    window.addEventListener('click', (event) => {
      const reportModal = document.getElementById('report-modal');
      if (event.target === reportModal) {
        reportModal.style.display = 'none';
      }
    });

    const backButton = document.getElementById('back-to-list');
    if (backButton) {
      backButton.addEventListener('click', backToListView);
    }

    const openSubgraphViewButton = document.getElementById('openSubgraphView');
    if (openSubgraphViewButton) {
      openSubgraphViewButton.addEventListener('click', () => {
        if (!currentFilteredType) {
          showNotification('Please select a node type first by clicking one of the filter buttons.', 'warning');
          return;
        }
        openSubgraphModal(currentFilteredType);
      });
    }

    const notificationClose = document.getElementById('notification-close');
    if (notificationClose) {
      notificationClose.addEventListener('click', hideNotification);
    }
  
    const closeModalButton = document.querySelector('.close-modal');
    if (closeModalButton) {
      closeModalButton.addEventListener('click', () => {
        const modal = document.getElementById('subgraph-modal');
        if (modal) {
          modal.style.display = 'none';
        }
      });
    }

    window.addEventListener('click', (event) => {
      const modal = document.getElementById('subgraph-modal');
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });

    const filterInvestorButton = document.getElementById('filterInvestor');
    if (filterInvestorButton) {
      filterInvestorButton.addEventListener('click', () => {
        currentFilteredType = 'Investor';
        filterByType(['Investor']);
        setActiveFilterButton('filterInvestor');
      });
    }
    
    const filterUseCaseButton = document.getElementById('filterUseCase');
    if (filterUseCaseButton) {
      filterUseCaseButton.addEventListener('click', () => {
        currentFilteredType = 'UseCase';
        filterByType(['UseCase']);
        setActiveFilterButton('filterUseCase');
      });
    }
    
    const filterProtocolButton = document.getElementById('filterProtocol');
    if (filterProtocolButton) {
      filterProtocolButton.addEventListener('click', () => {
        currentFilteredType = 'Protocol';
        filterByType(['Protocol']);
        setActiveFilterButton('filterProtocol');
      });
    }

    const filterCompanyButton = document.getElementById('filterCompany');
    if (filterCompanyButton) {
      filterCompanyButton.addEventListener('click', () => {
        currentFilteredType = 'Company';
        filterByType(['Company']);
        setActiveFilterButton('filterCompany');
      });
    }

    const filterServiceButton = document.getElementById('filterService');
    if (filterServiceButton) {
      filterServiceButton.addEventListener('click', () => {
        currentFilteredType = 'Service';
        filterByType(['Service']);
        setActiveFilterButton('filterService');
      });
    }

    const filterProductButton = document.getElementById('filterProduct');
    if (filterProductButton) {
      filterProductButton.addEventListener('click', () => {
        currentFilteredType = 'Product';
        filterByType(['Product']);
        setActiveFilterButton('filterProduct');
      });
    }
  
    const filterAllButton = document.getElementById('filterAll');
    if (filterAllButton) {
      filterAllButton.addEventListener('click', () => {
        // Restore any hidden nodes before showing all
        if (window.hiddenNodes && window.hiddenNodes.length > 0) {
          cy.add(window.hiddenNodes);
          window.hiddenNodes = cy.collection(); // Clear the hidden nodes collection
        }
        
        currentFilteredType = null;
        cy.elements().removeClass('highlighted connected reachable highlighted-edge connected-edge reachable-edge faded');
        
        // Reset hide button
        resetHideButton();
        
        cy.fit();
        setActiveFilterButton(null); // Remove active state from all buttons
        
        showSuccessNotification('All filters cleared.');
      });
    }

    // Set up node click handler for info panel
    const closeButton = document.getElementById('close-info');
    const infoBlock = document.getElementById('info');
    const infoPanel = document.getElementById('info-content');

    if (cy && infoPanel) {
      cy.on('tap', 'node', function(evt) {
        const node = evt.target;
        console.log('Node clicked:', node.id(), node.data());

        // Display node properties
        const properties = node.data('properties') || {};
        let propertiesText = '';
        
        for (const key in properties) {
          if (key === 'url' || key === 'github') {
            console.log('Link found:', key, properties[key]);
            propertiesText += `<div class="property"><strong>${key}</strong>: <a href="${properties[key]}" rel="nofollow" target="_blank">${properties[key]}</a></div>`;
          } else {
            propertiesText += `<div class="property"><strong>${key}</strong>: ${properties[key]}</div>`;
          }
        }
        
        infoPanel.innerHTML = `<div class="nodeTitle"><strong>${node.data('label')}</strong> (${node.data('type')})</div>`;
        infoPanel.innerHTML += `${propertiesText}`;
        
        if (infoBlock) {
          infoBlock.style.display = 'block';
        }
      });
    }
    
    if (closeButton && infoBlock) {
      closeButton.addEventListener('click', function() {
        infoBlock.style.display = 'none';
      });
    }
  }

  // Global variables to track state
  let currentFilteredType = null;
  let currentDetailNode = null;
  let allTypeNodes = null;

  // HIDE FADED NODES FUNCTIONALITY
  function hideFadedNodes() {
    if (!cy) {
      showErrorNotification('Graph not initialized yet.');
      return;
    }

    const fadedNodes = cy.nodes('.faded');
    const fadedEdges = cy.edges('.faded');
    
    if (fadedNodes.length === 0 && fadedEdges.length === 0) {
      showNotification('No faded nodes to hide. Try performing a search or filter first.', 'info');
      return;
    }

    // Store hidden nodes for potential restoration
    const newHiddenElements = fadedNodes.union(fadedEdges);
    window.hiddenNodes = window.hiddenNodes.union(newHiddenElements);
    
    // Actually remove the faded elements from the graph
    fadedNodes.remove();
    fadedEdges.remove();
    
    // Update button to show restore option
    const hideFadedButton = document.getElementById('hideFadedNodes');
    if (hideFadedButton) {
      hideFadedButton.textContent = `Show Hidden Elements (${newHiddenElements.length})`;
      hideFadedButton.style.backgroundColor = '#27ae60';
      hideFadedButton.style.borderColor = '#229954';
      hideFadedButton.style.borderWidth = '1px';
      hideFadedButton.style.color = 'white';
      hideFadedButton.disabled = false;
      
      // Replace event listener
      hideFadedButton.replaceWith(hideFadedButton.cloneNode(true));
      const newButton = document.getElementById('hideFadedNodes');
      newButton.addEventListener('click', showHiddenNodes);
    }
    
    showSuccessNotification(`Hidden ${fadedNodes.length} nodes and ${fadedEdges.length} edges.`);
    
    // Fit view to remaining visible elements
    const visibleElements = cy.elements();
    if (visibleElements.length > 0) {
      cy.fit(visibleElements, 50);
    }
  }

  function showHiddenNodes() {
    if (!cy) {
      showErrorNotification('Graph not initialized yet.');
      return;
    }

    if (!window.hiddenNodes || window.hiddenNodes.length === 0) {
      showNotification('No hidden nodes to restore.', 'info');
      return;
    }

    // Restore all hidden elements back to the graph
    cy.add(window.hiddenNodes);
    
    const hiddenCount = window.hiddenNodes.length;
    window.hiddenNodes = cy.collection(); // Clear the collection
    
    // Reset button
    const hideFadedButton = document.getElementById('hideFadedNodes');
    if (hideFadedButton) {
      hideFadedButton.textContent = 'Hide Faded Elements';
      hideFadedButton.style.backgroundColor = '#e74c3c';
      hideFadedButton.style.color = 'white';
      hideFadedButton.disabled = true;
      
      // Replace event listener
      hideFadedButton.replaceWith(hideFadedButton.cloneNode(true));
      const newButton = document.getElementById('hideFadedNodes');
      newButton.addEventListener('click', hideFadedNodes);
    }
    
    showSuccessNotification(`Restored ${hiddenCount} hidden elements.`);
    
    // Fit view to all elements
    cy.fit();
  }

  function updateHideButtonForSearch() {
    const hideFadedButton = document.getElementById('hideFadedNodes');
    if (hideFadedButton && cy) {
      const fadedElements = cy.elements('.faded');
      const hiddenCount = window.hiddenNodes ? window.hiddenNodes.length : 0;
      
      if (fadedElements.length > 0) {
        let buttonText = `Hide Faded Elements (${fadedElements.length})`;
        if (hiddenCount > 0) {
          buttonText += ` | ${hiddenCount} Hidden`;
        }
        hideFadedButton.textContent = buttonText;
        hideFadedButton.style.backgroundColor = '#e74c3c';
        hideFadedButton.style.color = 'white';
        hideFadedButton.disabled = false;
        
        // Ensure correct event listener
        hideFadedButton.replaceWith(hideFadedButton.cloneNode(true));
        const newButton = document.getElementById('hideFadedNodes');
        newButton.addEventListener('click', hideFadedNodes);
        
      } else if (hiddenCount > 0) {
        hideFadedButton.textContent = `Show Hidden Nodes (${hiddenCount})`;
        hideFadedButton.style.backgroundColor = '#27ae60';
        hideFadedButton.style.color = 'white';
        hideFadedButton.disabled = false;
        
        // Ensure correct event listener
        hideFadedButton.replaceWith(hideFadedButton.cloneNode(true));
        const newButton = document.getElementById('hideFadedNodes');
        newButton.addEventListener('click', showHiddenNodes);
        
      } else {
        hideFadedButton.textContent = 'Hide Faded Nodes';
        hideFadedButton.style.backgroundColor = '#e6e6e6';
        hideFadedButton.style.color = '#000';
        hideFadedButton.disabled = true;
      }
    }
  }

  function resetHideButton() {
    const hideFadedButton = document.getElementById('hideFadedNodes');
    if (hideFadedButton) {
      hideFadedButton.textContent = 'Hide Faded Nodes';
      hideFadedButton.style.backgroundColor = '#e6e6e6';
      hideFadedButton.style.color = '#000';
      hideFadedButton.disabled = true;
      
      // Reset event listener
      hideFadedButton.replaceWith(hideFadedButton.cloneNode(true));
      const newButton = document.getElementById('hideFadedNodes');
      newButton.addEventListener('click', hideFadedNodes);
    }
  }

  // SEARCH FUNCTIONALITY
  function performSearch() {
    if (!cy) return;
    
    const searchElement = document.getElementById('search');
    const includeConnectedElement = document.getElementById('includeConnected');
    const includeReachableElement = document.getElementById('includeReachable');
    const maxDepthElement = document.getElementById('maxDepth');
    
    if (!searchElement) return;
    
    const query = searchElement.value.toLowerCase();
    const includeConnected = includeConnectedElement ? includeConnectedElement.checked : true;
    const includeReachable = includeReachableElement ? includeReachableElement.checked : true;
    const maxDepth = maxDepthElement ? parseInt(maxDepthElement.value) : 3;
    
    // IMPORTANT: Restore any hidden nodes before performing new search
    if (window.hiddenNodes && window.hiddenNodes.length > 0) {
      cy.add(window.hiddenNodes);
      window.hiddenNodes = cy.collection(); // Clear the hidden nodes collection
    }
    
    // Reset all styles first
    cy.elements().removeClass('highlighted connected reachable highlighted-edge connected-edge reachable-edge faded');
    
    // Reset hide button if no search query
    if (query === '') {
      resetHideButton();
      return;
    }
    
    // Find matching nodes (now searching in the complete graph)
    const matchingNodes = cy.nodes().filter(node => 
      node.data('label') && node.data('label').toLowerCase().includes(query)
    );
    
    if (matchingNodes.length === 0) {
      // No matches found - fade everything
      cy.elements().addClass('faded');
      updateHideButtonForSearch();
      showNotification(`No nodes found matching "${query}".`, 'warning');
      return;
    }

    // Highlight matching nodes
    matchingNodes.addClass('highlighted');
    
    // Collections to track different node categories
    let connectedNodes = cy.collection();
    let connectedEdges = cy.collection();
    let reachableNodes = cy.collection();
    let reachableEdges = cy.collection();
    let allHighlightedElements = matchingNodes.clone();
    
    // Get directly connected elements if option is checked
    if (includeConnected) {
      connectedEdges = matchingNodes.connectedEdges();
      connectedEdges.addClass('connected-edge');
      
      connectedNodes = connectedEdges.connectedNodes().filter(node => 
        !matchingNodes.contains(node)
      );
      connectedNodes.addClass('connected');
      
      allHighlightedElements = allHighlightedElements.union(connectedNodes).union(connectedEdges);
    }
    
    // Get reachable nodes if option is checked
    if (includeReachable) {
      let startNodes = matchingNodes.clone();
      if (includeConnected) {
        startNodes = startNodes.union(connectedNodes);
      }
      
      let currentFrontier = startNodes;
      let visitedNodes = new Set(startNodes.map(node => node.id()));
      let visitedEdges = new Set(connectedEdges.map(edge => edge.id()));
      
      for (let depth = 1; depth <= maxDepth; depth++) {
        let nextFrontier = cy.collection();
        
        currentFrontier.forEach(node => {
          const outEdges = node.outgoers('edge').filter(edge => 
            !visitedEdges.has(edge.id())
          );
          
          outEdges.forEach(edge => {
            visitedEdges.add(edge.id());
            reachableEdges = reachableEdges.union(edge);
            
            const targetNode = edge.target();
            if (!visitedNodes.has(targetNode.id())) {
              visitedNodes.add(targetNode.id());
              reachableNodes = reachableNodes.union(targetNode);
              nextFrontier = nextFrontier.union(targetNode);
            }
          });
        });
        
        currentFrontier = nextFrontier;
        
        if (currentFrontier.empty()) {
          break;
        }
      }
      
      reachableNodes.addClass('reachable');
      reachableEdges.addClass('reachable-edge');
      
      allHighlightedElements = allHighlightedElements.union(reachableNodes).union(reachableEdges);
    }
    
    // Fade all other elements
    const fadedElements = cy.elements().difference(allHighlightedElements);
    fadedElements.addClass('faded');
    
    // Update hide button state
    updateHideButtonForSearch();
    
    // Fit view to highlighted elements
    if (allHighlightedElements.length > 0) {
      cy.fit(allHighlightedElements, 50);
    }
    
    // Show search results summary
    const fadedCount = fadedElements.length;
    const highlightedCount = allHighlightedElements.length;
    showNotification(`Found ${matchingNodes.length} matching nodes. ${highlightedCount} elements highlighted, ${fadedCount} elements faded.`, 'success');
  }

  // FILTER BY TYPE FUNCTIONALITY
  function filterByType(types) {
    if (!cy) return;
    
    // Restore any hidden nodes before applying new filter
    if (window.hiddenNodes && window.hiddenNodes.length > 0) {
      cy.add(window.hiddenNodes);
      window.hiddenNodes = cy.collection(); // Clear the hidden nodes collection
    }
    
    cy.elements().removeClass('highlighted connected reachable highlighted-edge connected-edge reachable-edge faded');
    
    // Filter nodes by type
    const filteredNodes = cy.nodes().filter(node => types.includes(node.data('type')));
    
    if (filteredNodes.length === 0) {
      cy.elements().addClass('faded');
      updateHideButtonForSearch();
      return;
    }
    
    // Highlight filtered nodes
    filteredNodes.addClass('highlighted');
    
    // Get connected edges and nodes
    const connectedEdges = filteredNodes.connectedEdges();
    connectedEdges.addClass('connected-edge');
    
    const connectedNodes = connectedEdges.connectedNodes().filter(node => 
      !filteredNodes.contains(node)
    );
    connectedNodes.addClass('connected');
    
    // Fade out all other elements
    cy.elements().difference(filteredNodes.union(connectedEdges).union(connectedNodes)).addClass('faded');
    
    // Update hide button state
    updateHideButtonForSearch();
    
    // Fit view to highlighted elements
    cy.fit(filteredNodes.union(connectedEdges).union(connectedNodes), 50);
  }

  // MULTI-TYPE FILTER FUNCTIONALITY
  function applyMultiTypeFilter() {
    if (!cy) {
      showErrorNotification('Graph not initialized yet.');
      return;
    }

    const selectElement = document.getElementById('nodeTypeSelect');
    if (!selectElement) {
      showErrorNotification('Type selector not found.');
      return;
    }

    const selectedTypes = Array.from(selectElement.selectedOptions).map(option => option.value);
    
    if (selectedTypes.length === 0) {
      showWarningNotification('Please select at least one node type to filter.');
      return;
    }

    // Restore any hidden nodes before applying new filter
    if (window.hiddenNodes && window.hiddenNodes.length > 0) {
      cy.add(window.hiddenNodes);
      window.hiddenNodes = cy.collection();
    }

    window.currentTypeFilter = selectedTypes;
    
    // Clear existing styles
    cy.elements().removeClass('highlighted connected reachable highlighted-edge connected-edge reachable-edge faded');
    
    // Filter nodes by selected types
    const filteredNodes = cy.nodes().filter(node => selectedTypes.includes(node.data('type')));
    
    if (filteredNodes.length === 0) {
      cy.elements().addClass('faded');
      updateHideButtonForSearch();
      showWarningNotification('No nodes found for the selected types.');
      return;
    }

    // Highlight filtered nodes
    filteredNodes.addClass('highlighted');
    
    // Get connected edges and nodes
    const connectedEdges = filteredNodes.connectedEdges();
    connectedEdges.addClass('connected-edge');
    
    const connectedNodes = connectedEdges.connectedNodes().filter(node => 
      !filteredNodes.contains(node)
    );
    connectedNodes.addClass('connected');
    
    // Fade out all other elements
    cy.elements().difference(filteredNodes.union(connectedEdges).union(connectedNodes)).addClass('faded');
    
    // Update hide button state
    updateHideButtonForSearch();
    
    // Fit view to highlighted elements
    cy.fit(filteredNodes.union(connectedEdges).union(connectedNodes), 50);
    
    showSuccessNotification(`Filtered to ${selectedTypes.length} node type(s): ${selectedTypes.join(', ')}`);
  }

  function clearMultiTypeFilter() {
    if (!cy) {
      showErrorNotification('Graph not initialized yet.');
      return;
    }

    // Restore any hidden nodes before clearing filter
    if (window.hiddenNodes && window.hiddenNodes.length > 0) {
      cy.add(window.hiddenNodes);
      window.hiddenNodes = cy.collection();
    }

    const selectElement = document.getElementById('nodeTypeSelect');
    if (selectElement) {
      selectElement.selectedIndex = -1; // Clear all selections
    }

    window.currentTypeFilter = [];
    
    // Clear all styles
    cy.elements().removeClass('highlighted connected reachable highlighted-edge connected-edge reachable-edge faded');
    
    // Reset hide button
    resetHideButton();
    
    // Fit view to all elements
    cy.fit();
    
    showSuccessNotification('Type filter cleared.');
  }

  // USE CASE REPORT FUNCTIONALITY
  function generateUseCaseReport() {
    if (!cy) return;

    // Get all use cases
    const useCases = cy.nodes().filter(node => node.data('type') === 'UseCase');
    
    if (useCases.length === 0) {
      showWarningNotification('No use cases found in the graph.');
      return;
    }

    const reportData = {};
    
    // For each use case, find products and services in its area
    useCases.forEach(useCase => {
      const useCaseLabel = useCase.data('label');
      const useCaseId = useCase.id();
      
      // Find all edges with "IN_AREA" relationship from this use case
      const inAreaEdges = useCase.connectedEdges().filter(edge => {
        const edgeLabel = edge.data('label');
        return edgeLabel && edgeLabel.toLowerCase().includes('in_area');
      });
      
      // Get connected products and services
      const connectedNodes = inAreaEdges.connectedNodes().filter(node => {
        const nodeType = node.data('type');
        return (nodeType === 'Product' || nodeType === 'Service') && node.id() !== useCaseId;
      });
      
      if (connectedNodes.length > 0) {
        reportData[useCaseLabel] = {
          useCase: {
            id: useCaseId,
            label: useCaseLabel,
            properties: useCase.data('properties') || {}
          },
          items: []
        };
        
        connectedNodes.forEach(node => {
          reportData[useCaseLabel].items.push({
            id: node.id(),
            label: node.data('label'),
            type: node.data('type'),
            properties: node.data('properties') || {}
          });
        });
        
        // Sort items by type, then by label
        reportData[useCaseLabel].items.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type.localeCompare(b.type);
          }
          return a.label.localeCompare(b.label);
        });
      }
    });
    
    if (Object.keys(reportData).length === 0) {
      showWarningNotification('No products or services found with IN_AREA relationships to use cases.');
      return;
    }

    // Store report data globally for export
    window.reportData = reportData;
    
    // Generate and display the report
    displayUseCaseReport(reportData);
  }

  function displayUseCaseReport(data) {
    const modal = document.getElementById('report-modal');
    const reportContent = document.getElementById('report-content');
    
    if (!modal || !reportContent) return;

    let html = '';
    
    // Sort use cases alphabetically
    const sortedUseCases = Object.keys(data).sort();
    
    sortedUseCases.forEach(useCaseLabel => {
      const useCaseData = data[useCaseLabel];
      const itemCount = useCaseData.items.length;
      
      html += `
        <div class="use-case-group">
          <div class="use-case-title">
            ${useCaseLabel} 
            <span style="font-size: 14px; color: #666; font-weight: normal;">
              (${itemCount} item${itemCount !== 1 ? 's' : ''})
            </span>
          </div>
          <div class="items-grid">
      `;
      
      useCaseData.items.forEach(item => {
        html += `
          <div class="item-card">
            <div class="item-title">${item.label}</div>
            <div class="item-type">${item.type}</div>
            <div class="item-properties">
        `;
        
        // Add properties if they exist
        if (Object.keys(item.properties).length > 0) {
          for (const [key, value] of Object.entries(item.properties)) {
            if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
              html += `<div><strong>${key}:</strong> <a href="${value}" target="_blank" rel="noopener noreferrer">${value}</a></div>`;
            } else {
              html += `<div><strong>${key}:</strong> ${value}</div>`;
            }
          }
        } else {
          html += '<div style="color: #999; font-style: italic;">No additional properties</div>';
        }
        
        html += `
            </div>
          </div>
        `;
      });
      
      html += `
          </div>
        </div>
      `;
    });
    
    reportContent.innerHTML = html;
    modal.style.display = 'block';
    
    showSuccessNotification(`Generated report for ${sortedUseCases.length} use case${sortedUseCases.length !== 1 ? 's' : ''}.`);
  }

  function exportReport(format) {
    if (!window.reportData) {
      showErrorNotification('No report data available to export.');
      return;
    }

    const data = window.reportData;
    
    if (format === 'json') {
      exportAsJSON(data);
    } else if (format === 'csv') {
      exportAsCSV(data);
    }
  }

  function exportAsJSON(data) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `use-case-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccessNotification('Report exported as JSON.');
  }

  function exportAsCSV(data) {
    let csvContent = 'Use Case,Item Name,Item Type,Property Key,Property Value\n';
    
    Object.keys(data).forEach(useCaseLabel => {
      const useCaseData = data[useCaseLabel];
      
      useCaseData.items.forEach(item => {
        if (Object.keys(item.properties).length > 0) {
          Object.entries(item.properties).forEach(([key, value]) => {
            csvContent += `"${useCaseLabel}","${item.label}","${item.type}","${key}","${value}"\n`;
          });
        } else {
          csvContent += `"${useCaseLabel}","${item.label}","${item.type}","",""\n`;
        }
      });
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `use-case-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccessNotification('Report exported as CSV.');
  }

  // SUBGRAPH MODAL FUNCTIONALITY
  function openSubgraphModal(nodeType) {
    if (!cy) return;
    
    // Set the current filtered type
    currentFilteredType = nodeType;
    currentDetailNode = null;
    
    // Update modal title
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) {
      modalTitle.textContent = `${nodeType} Nodes`;
    }
    
    // Get nodes of the selected type
    const typeNodes = cy.nodes().filter(node => node.data('type') === nodeType);
    allTypeNodes = typeNodes; // Store for later use
    
    // Show the modal
    const modal = document.getElementById('subgraph-modal');
    if (modal) {
      modal.style.display = 'block';
    }
    
    // Hide back button initially
    const backButton = document.getElementById('back-to-list');
    if (backButton) {
      backButton.style.display = 'none';
    }
    
    // Set modal to table-only view
    const modalBody = document.querySelector('.modal-body');
    if (modalBody) {
      modalBody.classList.add('table-only');
      modalBody.classList.remove('split-view');
    }
    
    // Hide graph view
    const graphView = document.getElementById('graph-view');
    if (graphView) {
      graphView.style.display = 'none';
    }
    
    // Populate the table with all nodes of the selected type
    populateTypeNodesTable(typeNodes);
  }

  function initializeSubgraph(typeNodes, detailNode = null, connectedNodes = null, connectedEdges = null) {
    // If there's an existing subgraph, destroy it
    if (window.subgraphCy) {
      try {
        window.subgraphCy.destroy();
      } catch (e) {
        console.warn('Could not properly clean up previous subgraph:', e);
      }
    }
    
    // Create elements for the subgraph
    const elements = [];
    
    // Add the type nodes
    typeNodes.forEach(node => {
      elements.push({
        data: {
          id: node.id(),
          label: node.data('label'),
          type: node.data('type'),
          properties: node.data('properties')
        },
        grabbable: false // Make nodes not grabbable
      });
    });
    
    // If we're showing detail view, add connected nodes and edges
    if (detailNode && connectedNodes && connectedEdges) {
      // Add the connected nodes
      connectedNodes.forEach(node => {
        if (!elements.some(el => el.data && el.data.id === node.id())) {
          elements.push({
            data: {
              id: node.id(),
              label: node.data('label'),
              type: node.data('type'),
              properties: node.data('properties')
            },
            grabbable: true // Make nodes not grabbable
          });
        }
      });
      
      // Add the edges
      connectedEdges.forEach(edge => {
        elements.push({
          data: {
            id: edge.id(),
            source: edge.source().id(),
            target: edge.target().id(),
            label: edge.data('label')
          }
        });
      });
    }
    
    // Choose appropriate layout based on view type
    let layoutOptions;
    
    if (detailNode) {
      layoutOptions = {
        name: 'cose-bilkent',
        animate: true,
        randomize: false,
        nodeDimensionsIncludeLabels: true,
        nodeRepulsion: 8000,
        idealEdgeLength: 100,
        edgeElasticity: 0.45,
        nestingFactor: 0.1,
        gravity: 0.25,
        numIter: 2500,
        initialEnergyOnIncremental: 0.5,
        ready: function() {
          // This function is called when the layout is ready
        }
      };
    } else {
      // List view - use a grid layout for better visibility
      layoutOptions = {
        name: 'grid',
        fit: true,
        padding: 30,
        avoidOverlap: true,
        nodeDimensionsIncludeLabels: true,
        spacingFactor: 1.2,
        condense: true,
        rows: Math.ceil(Math.sqrt(typeNodes.length)),
        cols: Math.ceil(Math.sqrt(typeNodes.length))
      };
    }
    
    // Initialize the subgraph cytoscape instance
    window.subgraphCy = cytoscape({
      container: document.getElementById('subgraph-cy'),
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'label': function(ele) {
              const label = ele.data('label');
              if (!label) return '';
              
              const words = label.split(' ');
              let lines = [];
              let currentLine = '';
              
              for (let word of words) {
                if (currentLine.length + word.length > 10) { 
                  lines.push(currentLine);
                  currentLine = word;
                } else {
                  currentLine += (currentLine ? ' ' : '') + word;
                }
              }
              if (currentLine) lines.push(currentLine);
              
              return lines.join('\n');
            },
            'text-valign': 'center',
            'text-halign': 'center',
            'background-color': '#666',
            'color': '#000',
            'font-size': 5,
            'text-wrap': 'wrap',
            'text-max-width': 60,
            'text-overflow-wrap': 'whitespace',
            'text-background-color': '#fff',
            'text-background-opacity': 0.7,
            'text-background-padding': 2,
            'text-background-shape': 'roundrectangle',
            'transition-property': 'background-color, border-color, border-width',
            'transition-duration': '0.2s'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 1,
            'line-color': '#999',
            'target-arrow-color': '#999',
            'target-arrow-shape': 'chevron',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': 5,
            'text-rotation': 'autorotate',
            'text-background-color': '#fff',
            'text-background-opacity': 0.7,
            'text-background-padding': 2
          }
        },
        {
          selector: '.highlighted',
          style: {
            'background-color': '#ff7f00',
            'text-outline-color': '#ff7f00',
            'color': '#000',
            'z-index': 20,
            'transition-property': 'background-color, text-outline-color',
            'transition-duration': '0.5s'
          }
        },
        {
          selector: '.connected-edge',
          style: {
            'line-color': '#ff7f00',
            'color': '#ff7f00',
            'target-arrow-color': '#ff7f00',
            'font-weight': 'bold',
            'width': 3,
            'z-index': 15,
            'transition-property': 'line-color, target-arrow-color, width',
            'transition-duration': '0.5s'
          }
        },
        {
          selector: '.detail-node',
          style: {
            'background-color': '#ff7f00',
            'z-index': 30
          }
        }
      ],
      layout: layoutOptions,
    });
    
    // Apply node styles based on type
    const nodeStyles = {
      'Company': { 'background-color': '#66ddff', 'shape': 'round-hexagon' },
      'Product': { 'background-color': '#66aaff', 'shape': 'ellipse' },
      'Investor': { 'background-color': '#ff6666', 'shape': 'round-rectangle' },
      'UseCase': { 'background-color': '#a126c6', 'shape': 'round-pentagon' },
      'Protocol': { 'background-color': '#616a6b', 'shape': 'round-triangle' },
      'Service': { 'background-color': '#f39c12', 'shape': 'round-octagon' },
    };
    
    // Apply styles to nodes
    Object.keys(nodeStyles).forEach(type => {
      window.subgraphCy.style()
        .selector(`node[type="${type}"]`)
        .style(nodeStyles[type])
        .update();
    });
    
    // If we're in detail view, highlight the detail node
    if (detailNode) {
      const detailNodeInSubgraph = window.subgraphCy.getElementById(detailNode.id());
      if (detailNodeInSubgraph.length > 0) {
        detailNodeInSubgraph.addClass('detail-node');
        
        // Run a special layout to position the detail node in the center
        window.subgraphCy.layout({
          name: 'concentric',
          concentric: function(node) {
            return node.id() === detailNode.id() ? 10 : 0;
          },
          levelWidth: function() { return 1; },
          minNodeSpacing: 50,
          animate: true
        }).run();
      }
    }
    
    // Add click event to nodes in subgraph
    window.subgraphCy.on('tap', 'node', function(evt) {
      const node = evt.target;
      
      // If we're in the list view, show detail view for this node
      if (!currentDetailNode) {
        showNodeDetail(node.id());
      } else {
        // If we're already in detail view, just highlight connections
        highlightConnections(node);
      }
    });
    
    // Fit the view
    setTimeout(() => {
      window.subgraphCy.fit();
    }, 100);
  }

  function populateTypeNodesTable(typeNodes) {
    const tableBody = document.getElementById('connected-nodes-body');
    const tableTitle = document.getElementById('table-title');
    const tableHeader = document.getElementById('table-header');
    
    if (!tableBody || !tableTitle || !tableHeader) return;
    
    // Update table title
    tableTitle.innerHTML = `${currentFilteredType} Nodes <span class="node-count">(${typeNodes.length})</span>`;
    
    // Update table header
    tableHeader.innerHTML = `
      <tr>
        <th>Label</th>
        <th>Connections</th>
        <th>Action</th>
      </tr>
    `;
    
    // Clear the table
    tableBody.innerHTML = '';
    
    // Add the toggle graph button first
    addToggleGraphButton();
    
    // Sort nodes by label
    const sortedNodes = typeNodes.sort((a, b) => {
      const labelA = a.data('label') || '';
      const labelB = b.data('label') || '';
      return labelA.localeCompare(labelB);
    });
    
    // Add rows for each node
    sortedNodes.forEach(node => {
      // Count connections
      const connections = node.connectedEdges().length;
      
      // Create table row
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${node.data('label')}</td>
        <td>${connections}</td>
        <td><button class="view-btn">View</button></td>
      `;
      
      // Add click event to the view button
      const viewBtn = row.querySelector('.view-btn');
      viewBtn.addEventListener('click', () => {
        showNodeDetail(node.id());
      });
      
      tableBody.appendChild(row);
    });
  }

  function addToggleGraphButton() {
    const tableBody = document.getElementById('connected-nodes-body');
    if (!tableBody) return;
    
    // Find existing button row
    const existingBtnRow = tableBody.querySelector('.toggle-graph-btn-row');
    
    // Determine if graph is currently visible
    const graphView = document.getElementById('graph-view');
    const isGraphVisible = graphView && graphView.style.display !== 'none';
    
    // If we already have a button row, just update it
    if (existingBtnRow) {
      const toggleBtn = existingBtnRow.querySelector('#toggle-graph-btn');
      if (toggleBtn) {
        // Update button class and text
        toggleBtn.className = `toggle-graph-btn ${isGraphVisible ? 'hide-graph-btn' : 'show-graph-btn'}`;
        toggleBtn.textContent = isGraphVisible ? 'Hide Graph View' : 'Show Graph View';
        
        // Remove old event listeners to prevent duplicates
        const newToggleBtn = toggleBtn.cloneNode(true);
        toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
        
        // Add fresh event listener
        newToggleBtn.addEventListener('click', toggleGraphView);
        
        // No need to create a new row
        return;
      }
    }
    
    // If we reach here, we need to create a new button row
    const buttonRow = document.createElement('tr');
    buttonRow.className = 'toggle-graph-btn-row'; // Add a class for easy identification
    buttonRow.innerHTML = `
      <td colspan="3" style="text-align: center;">
        <button id="toggle-graph-btn" class="toggle-graph-btn ${isGraphVisible ? 'hide-graph-btn' : 'show-graph-btn'}">
          ${isGraphVisible ? 'Hide Graph View' : 'Show Graph View'}
        </button>
      </td>
    `;
    
    // Insert at the beginning of the table
    if (tableBody.firstChild) {
      tableBody.insertBefore(buttonRow, tableBody.firstChild);
    } else {
      tableBody.appendChild(buttonRow);
    }
    
    // Add event listener
    const toggleGraphBtn = document.getElementById('toggle-graph-btn');
    if (toggleGraphBtn) {
      toggleGraphBtn.addEventListener('click', toggleGraphView);
    }
  }

  function toggleGraphView(event) {
    // Prevent default behavior and stop propagation
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const graphView = document.getElementById('graph-view');
    const modalBody = document.querySelector('.modal-body');
    
    if (!graphView || !modalBody) {
      console.error('Graph view or modal body not found');
      return;
    }
    
    const isGraphVisible = graphView.style.display !== 'none';
    
    if (isGraphVisible) {
      // Hide graph
      graphView.style.display = 'none';
      modalBody.classList.add('table-only');
      modalBody.classList.remove('split-view');
    } else {
      // Show graph
      graphView.style.display = 'block';
      modalBody.classList.remove('table-only');
      modalBody.classList.add('split-view');
      
      // If we have a detail node but haven't initialized the graph yet
      if (currentDetailNode && (!window.subgraphCy || window.subgraphCy.elements().length === 0)) {
        const connectedEdges = currentDetailNode.connectedEdges();
        const connectedNodes = connectedEdges.connectedNodes().filter(node => 
          node.id() !== currentDetailNode.id()
        );
        
        // Create a collection with just the detail node
        const detailNodeCollection = cy.collection().add(currentDetailNode);
        
        // Initialize subgraph
        initializeSubgraph(detailNodeCollection, currentDetailNode, connectedNodes, connectedEdges);
      }
    }
    
    // Update the toggle button directly
    const toggleBtn = document.getElementById('toggle-graph-btn');
    if (toggleBtn) {
      // Update button class and text
      toggleBtn.className = `toggle-graph-btn ${!isGraphVisible ? 'hide-graph-btn' : 'show-graph-btn'}`;
      toggleBtn.textContent = !isGraphVisible ? 'Hide Graph View' : 'Show Graph View';
    }
    
    return false; // Prevent default
  }

  function showNodeDetail(nodeId) {
    if (!cy) return;
    
    // Get the node
    const detailNode = cy.getElementById(nodeId);
    if (!detailNode.length) return;
    
    // Set current detail node
    currentDetailNode = detailNode;
    
    // Get connected nodes and edges
    const connectedEdges = detailNode.connectedEdges();
    const connectedNodes = connectedEdges.connectedNodes().filter(node => 
      node.id() !== detailNode.id()
    );
    
    // Show back button
    const backButton = document.getElementById('back-to-list');
    if (backButton) {
      backButton.style.display = 'block';
    }
    
    // Update table title
    const tableTitle = document.getElementById('table-title');
    if (tableTitle) {
      tableTitle.innerHTML = `
        <div class="node-detail-header">
          <span>${detailNode.data('label')}</span>
          <span class="node-type-badge">${detailNode.data('type')}</span>
        </div>
      `;
    }
    
    // Switch to split view
    const modalBody = document.querySelector('.modal-body');
    if (modalBody) {
      modalBody.classList.remove('table-only');
      modalBody.classList.add('split-view');
    }
    
    // Show graph view
    const graphView = document.getElementById('graph-view');
    if (graphView) {
      graphView.style.display = 'block';
    }
    
    // Create a collection with just the detail node
    const detailNodeCollection = cy.collection().add(detailNode);
    
    // Initialize subgraph with the detail node and its connections
    initializeSubgraph(detailNodeCollection, detailNode, connectedNodes, connectedEdges);
    
    // Update the node details table
    updateNodeDetailsTable(detailNode);
    
    // Ensure the toggle button is properly initialized with the correct state
    setTimeout(() => {
      const toggleBtn = document.getElementById('toggle-graph-btn');
      if (toggleBtn) {
        toggleBtn.className = 'toggle-graph-btn hide-graph-btn';
        toggleBtn.textContent = 'Hide Graph View';
        
        // Remove old event listeners to prevent duplicates
        const newToggleBtn = toggleBtn.cloneNode(true);
        toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
        
        // Add fresh event listener
        newToggleBtn.addEventListener('click', toggleGraphView);
      } else {
        // If button doesn't exist for some reason, add it
        addToggleGraphButton();
      }
    }, 0);
  }

  function highlightConnections(node) {
    if (!window.subgraphCy) return;
    
    // Reset all styles
    window.subgraphCy.elements().removeClass('highlighted connected-edge');
    
    // Find the node in the subgraph
    const subgraphNode = window.subgraphCy.getElementById(node.id());
    if (subgraphNode.length === 0) return;
    
    // Highlight the selected node
    subgraphNode.addClass('highlighted');
    
    // Highlight connected edges and nodes
    const connectedEdges = subgraphNode.connectedEdges();
    connectedEdges.addClass('connected-edge');
    
    const connectedNodes = connectedEdges.connectedNodes().filter(n => n.id() !== node.id());
    connectedNodes.addClass('highlighted');
    
    // Update the table to show node details
    updateNodeDetailsTable(node);
  }

  function updateNodeDetailsTable(node) {
    const tableBody = document.getElementById('connected-nodes-body');
    if (!tableBody) return;
    
    // Clear the table
    tableBody.innerHTML = '';
        
    // Add a header with node information
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
      <td colspan="3" style="background-color: #e6e6e6; font-weight: bold;">
        <div class="node-detail-header">
          <span>${node.data('label')}</span>
          <span class="node-type-badge">${node.data('type')}</span>
        </div>
      </td>
    `;
    tableBody.appendChild(headerRow);

    // Add the toggle graph button with the correct state
    const graphView = document.getElementById('graph-view');
    const isGraphVisible = graphView && graphView.style.display !== 'none';

    const buttonRow = document.createElement('tr');
    buttonRow.className = 'toggle-graph-btn-row';
    buttonRow.innerHTML = `
      <td colspan="3" style="text-align: center;">
        <button id="toggle-graph-btn" class="toggle-graph-btn ${isGraphVisible ? 'hide-graph-btn' : 'show-graph-btn'}">
          ${isGraphVisible ? 'Hide Graph View' : 'Show Graph View'}
        </button>
      </td>
    `;
    tableBody.appendChild(buttonRow);
    
    // Add node properties if available
    const properties = node.data('properties') || {};
    if (Object.keys(properties).length > 0) {
      const propertiesHeader = document.createElement('tr');
      propertiesHeader.innerHTML = `
        <td colspan="3" style="background-color: #f5f5f5; font-weight: bold;">
          Properties
        </td>
      `;
      tableBody.appendChild(propertiesHeader);
      
      for (const [key, value] of Object.entries(properties)) {
        const propertyRow = document.createElement('tr');
        
        // Check if the value is a URL
        const isUrl = typeof value === 'string' && 
          (value.startsWith('http://') || value.startsWith('https://'));
        
        if (isUrl) {
          propertyRow.innerHTML = `
            <td><strong>${key}</strong></td>
            <td colspan="2"><a href="${value}" target="_blank" rel="noopener noreferrer nofollow">${value}</a></td>
          `;
        } else {
          propertyRow.innerHTML = `
            <td><strong>${key}</strong></td>
            <td colspan="2">${value}</td>
          `;
        }
        
        tableBody.appendChild(propertyRow);
      }
    }
    
    // If this is not the detail node, show connection information
    if (currentDetailNode && node.id() !== currentDetailNode.id()) {
      // Find the edge between this node and the detail node
      const detailNodeInSubgraph = window.subgraphCy.getElementById(currentDetailNode.id());
      const edgeToDetailNode = node.edgesWith(detailNodeInSubgraph);
      
      if (edgeToDetailNode.length > 0) {
        // Add connection details
        const connectionHeader = document.createElement('tr');
        connectionHeader.innerHTML = `
          <td colspan="3" style="background-color: #f5f5f5; font-weight: bold;">
            Connection to ${currentDetailNode.data('label')}
          </td>
        `;
        tableBody.appendChild(connectionHeader);
        
        // Determine relationship direction
        let relationship = edgeToDetailNode.data('label') || 'connected to';
        let directionText;
        
        if (edgeToDetailNode.source().id() === currentDetailNode.id()) {
          directionText = `${currentDetailNode.data('label')} ${relationship} ${node.data('label')}`;
        } else {
          directionText = `${node.data('label')} ${relationship} ${currentDetailNode.data('label')}`;
        }
        
        const relationshipRow = document.createElement('tr');
        relationshipRow.innerHTML = `
          <td colspan="3">${directionText}</td>
        `;
        tableBody.appendChild(relationshipRow);
      }
    } else if (currentDetailNode && node.id() === currentDetailNode.id()) {
      // This is the detail node, show its connections summary
      const connectionsHeader = document.createElement('tr');
      connectionsHeader.innerHTML = `
        <td colspan="3" style="background-color: #f5f5f5; font-weight: bold;">
          Connections Summary
        </td>
      `;
      tableBody.appendChild(connectionsHeader);
      
      // Get connected nodes
      const connectedEdges = node.connectedEdges();
      const connectedNodes = connectedEdges.connectedNodes().filter(n => 
        n.id() !== node.id()
      );
      
      // Group connections by type
      const connectionsByType = {};
      connectedNodes.forEach(connNode => {
        const type = connNode.data('type');
        if (!connectionsByType[type]) {
          connectionsByType[type] = [];
        }
        connectionsByType[type].push(connNode);
      });
      
      // Add summary rows
      for (const [type, nodes] of Object.entries(connectionsByType)) {
        const summaryRow = document.createElement('tr');
        summaryRow.innerHTML = `
          <td>${type}</td>
          <td colspan="2">${nodes.length} connection${nodes.length !== 1 ? 's' : ''}</td>
        `;
        tableBody.appendChild(summaryRow);
      }
      
      // Add a button to view all connections - THIS WAS MISSING!
      if (connectedNodes.length > 0) {
        const viewAllRow = document.createElement('tr');
        viewAllRow.innerHTML = `
          <td colspan="3" style="text-align: center;">
            <button id="view-all-connections" class="view-all-btn">View All Connections</button>
          </td>
        `;
        tableBody.appendChild(viewAllRow);
        
        // Add event listener to the button
        setTimeout(() => {
          const viewAllBtn = document.getElementById('view-all-connections');
          if (viewAllBtn) {
            viewAllBtn.addEventListener('click', () => {
              populateConnectionsTable(node, connectedNodes, connectedEdges);
            });
          }
        }, 0);
      }
    }

    // Ensure the toggle button has the event listener
    setTimeout(() => {
      const toggleBtn = document.getElementById('toggle-graph-btn');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleGraphView);
      }
    }, 0);
  }


  function backToListView() {
    // Reset current detail node
    currentDetailNode = null;
    
    // Hide back button
    const backButton = document.getElementById('back-to-list');
    if (backButton) {
      backButton.style.display = 'none';
    }
    
    // Switch to table-only view
    const modalBody = document.querySelector('.modal-body');
    if (modalBody) {
      modalBody.classList.add('table-only');
      modalBody.classList.remove('split-view');
    }
    
    // Hide graph view
    const graphView = document.getElementById('graph-view');
    if (graphView) {
      graphView.style.display = 'none';
    }
    
    // Repopulate the table with all nodes of the selected type
    populateTypeNodesTable(allTypeNodes);
  }

  // Event delegation for toggle graph button
  document.addEventListener('click', function(event) {
    // Check if the clicked element is the toggle graph button
    if (event.target && event.target.id === 'toggle-graph-btn') {
      toggleGraphView(event);
    }
  });

  // Function to populate the table with connections for a specific node - THIS WAS MISSING!
  function populateConnectionsTable(detailNode, connectedNodes, connectedEdges) {
    const tableBody = document.getElementById('connected-nodes-body');
    const tableHeader = document.getElementById('table-header');
    
    if (!tableBody || !tableHeader) return;
    
    // Update table header
    tableHeader.innerHTML = `
      <tr>
        <th>Connected Node</th>
        <th>Type</th>
        <th>Relationship</th>
      </tr>
    `;
    
    // Clear the table
    tableBody.innerHTML = '';
    
    // Add the toggle graph button first
    addToggleGraphButton();
    
    // Add a back to details button - THIS WAS MISSING!
    const backRow = document.createElement('tr');
    backRow.innerHTML = `
      <td colspan="3" style="text-align: center;">
        <button id="back-to-details" class="back-to-details-btn">Back to Node Details</button>
      </td>
    `;
    tableBody.appendChild(backRow);
    
    // Add event listener to the back button
    setTimeout(() => {
      const backBtn = document.getElementById('back-to-details');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          updateNodeDetailsTable(detailNode);
        });
      }
    }, 0);
    
    // Group connected nodes by type
    const nodesByType = {};
    connectedNodes.forEach(node => {
      const type = node.data('type');
      if (!nodesByType[type]) {
        nodesByType[type] = [];
      }
      nodesByType[type].push(node);
    });
    
    // If no connections, show a message
    if (Object.keys(nodesByType).length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td colspan="3" style="text-align: center; padding: 20px;">No connections found</td>
      `;
      tableBody.appendChild(row);
      return;
    }
    
    // Add rows grouped by type
    Object.keys(nodesByType).sort().forEach(type => {
      // Add type header
      const headerRow = document.createElement('tr');
      headerRow.innerHTML = `
        <td colspan="3" style="background-color: #e6e6e6; font-weight: bold;">${type} (${nodesByType[type].length})</td>
      `;
      tableBody.appendChild(headerRow);
      
      // Sort nodes by label
      const sortedNodes = nodesByType[type].sort((a, b) => {
        const labelA = a.data('label') || '';
        const labelB = b.data('label') || '';
        return labelA.localeCompare(labelB);
      });
      
      // Add nodes of this type
      sortedNodes.forEach(node => {
        // Find the edge between these nodes
        const edge = connectedEdges.filter(e => 
          (e.source().id() === detailNode.id() && e.target().id() === node.id()) ||
          (e.target().id() === detailNode.id() && e.source().id() === node.id())
        );
        
        // Determine relationship direction
        let relationship = edge.length > 0 ? (edge[0].data('label') || 'connected to') : 'connected to';
        if (edge.length > 0) {
          if (edge[0].source().id() === detailNode.id()) {
            relationship += ' &rarr;'; // Outgoing
          } else {
            relationship += ' &larr;'; // Incoming
          }
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${node.data('label')}</td>
          <td>${node.data('type')}</td>
          <td>${relationship}</td>
        `;
        
        // Add click event to highlight this node in the graph and show its details
        row.addEventListener('click', () => {
          highlightConnections(node);
        });
        
        // Add hover effect
        row.style.cursor = 'pointer';
        row.addEventListener('mouseenter', () => {
          row.style.backgroundColor = '#f0f0f0';
        });
        row.addEventListener('mouseleave', () => {
          row.style.backgroundColor = '';
        });
        
        tableBody.appendChild(row);
      });
    });
  }

});

// NOTIFICATION FUNCTIONS
function showNotification(message, type = 'info', duration = 3000) {
  const notification = document.getElementById('notification');
  const notificationMessage = document.getElementById('notification-message');
  const notificationClose = document.getElementById('notification-close');
  
  if (!notification || !notificationMessage) return;
  
  // Clear any existing timeout
  if (window.notificationTimeout) {
    clearTimeout(window.notificationTimeout);
  }
  
  // Remove any existing classes and add the new type
  notification.className = 'notification';
  if (['error', 'success', 'warning'].includes(type)) {
    notification.classList.add(type);
  }
  
  // Set the message
  notificationMessage.textContent = message;
  
  // Show the notification
  notification.style.display = 'block';
  
  // Set up auto-hide after duration
  window.notificationTimeout = setTimeout(() => {
    hideNotification();
  }, duration);
  
  // Set up close button
  if (notificationClose) {
    notificationClose.onclick = hideNotification;
  }
}

function hideNotification() {
  const notification = document.getElementById('notification');
  if (!notification) return;
  
  // Add the hiding class for animation
  notification.classList.add('hiding');
  
  // After animation completes, hide the element
  setTimeout(() => {
    notification.style.display = 'none';
    notification.classList.remove('hiding');
  }, 300); // Match the animation duration
}

function showErrorNotification(message, duration = 4000) {
  showNotification(message, 'error', duration);
}

function showSuccessNotification(message, duration = 3000) {
  showNotification(message, 'success', duration);
}

function showWarningNotification(message, duration = 3500) {
  showNotification(message, 'warning', duration);
}

