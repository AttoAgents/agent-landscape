document.addEventListener('DOMContentLoaded', function() {
 

  // Create loading indicator if it doesn't exist
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
      }
    });
    
    // Styles based on types 
    const nodeStyles = {
      'Company': { 'background-color': '#66ddff', 'shape': 'round-hexagon' },
      'Product': { 'background-color': '#66aaff', 'shape': 'ellipse' },
      'Investor': { 'background-color': '#ff6666', 'shape': 'round-rectangle' },
      'UseCase': { 'background-color': '#a126c6', 'shape': 'round-pentagon' },
      'Protocol': { 'background-color': '#239b56', 'shape': 'round-triangle' },
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
        const searchElement = document.getElementById('search');
        if (searchElement) {
          searchElement.value = '';
        }
        cy.elements().removeClass('highlighted connected reachable highlighted-edge connected-edge reachable-edge faded');
      });
    }

    // Add event listeners for type filters
    const filterInvestorButton = document.getElementById('filterInvestor');
    if (filterInvestorButton) {
      filterInvestorButton.addEventListener('click', () => filterByType(['Investor']));
    }
    
    const filterUseCaseButton = document.getElementById('filterUseCase');
    if (filterUseCaseButton) {
      filterUseCaseButton.addEventListener('click', () => filterByType(['UseCase']));
    }
    
    const filterProtocolButton = document.getElementById('filterProtocol');
    if (filterProtocolButton) {
      filterProtocolButton.addEventListener('click', () => filterByType(['Protocol']));
    }
    
    const filterAllButton = document.getElementById('filterAll');
    if (filterAllButton) {
      filterAllButton.addEventListener('click', () => {
        cy.elements().removeClass('highlighted connected reachable highlighted-edge connected-edge reachable-edge faded');
        cy.fit();
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

  // Display only nodes of a given type provided by in the list as an argument
  function filterByType(types) {
    if (!cy) return;
    
    cy.elements().removeClass('highlighted connected reachable highlighted-edge connected-edge reachable-edge faded');
    
    // Filter nodes by type
    const filteredNodes = cy.nodes().filter(node => types.includes(node.data('type')));
    
    if (filteredNodes.length === 0) {
      cy.elements().addClass('faded');
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
    
    // Fit view to highlighted elements
    cy.fit(filteredNodes.union(connectedEdges).union(connectedNodes), 50);
  }
  
  // Advanced search function with reachability
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
    
    // Reset all styles
    cy.elements().removeClass('highlighted connected reachable highlighted-edge connected-edge reachable-edge faded');
    
    if (query === '') {
      return; // No search term, show everything normally
    }
    
    // Find matching nodes
    const matchingNodes = cy.nodes().filter(node => 
      node.data('label') && node.data('label').toLowerCase().includes(query)
    );
    
    if (matchingNodes.length === 0) {
      // No matches found
      cy.elements().addClass('faded');
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
      // Get all directly connected edges
      connectedEdges = matchingNodes.connectedEdges();
      connectedEdges.addClass('connected-edge');
      
      // Get directly connected nodes that aren't already highlighted
      connectedNodes = connectedEdges.connectedNodes().filter(node => 
        !matchingNodes.contains(node)
      );
      connectedNodes.addClass('connected');
      
      // Add to collection of all highlighted elements
      allHighlightedElements = allHighlightedElements.union(connectedNodes).union(connectedEdges);
    }
    
    // Get reachable nodes if option is checked
    if (includeReachable) {
      // Start with matched nodes and their direct connections
      let startNodes = matchingNodes.clone();
      if (includeConnected) {
        startNodes = startNodes.union(connectedNodes);
      }
      
      // Find all reachable nodes up to maxDepth
      let currentFrontier = startNodes;
      let visitedNodes = new Set(startNodes.map(node => node.id()));
      let visitedEdges = new Set(connectedEdges.map(edge => edge.id()));
      
      // BFS to find reachable nodes
      for (let depth = 1; depth <= maxDepth; depth++) {
        let nextFrontier = cy.collection();
        
        // For each node in current frontier
        currentFrontier.forEach(node => {
          // Get outgoing edges
          const outEdges = node.outgoers('edge').filter(edge => 
            !visitedEdges.has(edge.id())
          );
          
          // Add these edges to reachable edges
          outEdges.forEach(edge => {
            visitedEdges.add(edge.id());
            reachableEdges = reachableEdges.union(edge);
            
            // Get target node
            const targetNode = edge.target();
            if (!visitedNodes.has(targetNode.id())) {
              visitedNodes.add(targetNode.id());
              reachableNodes = reachableNodes.union(targetNode);
              nextFrontier = nextFrontier.union(targetNode);
            }
          });
        });
        
        currentFrontier = nextFrontier;
        
        // If no more nodes to explore, break early
        if (currentFrontier.empty()) {
          break;
        }
      }
      
      // Apply styles to reachable elements
      reachableNodes.addClass('reachable');
      reachableEdges.addClass('reachable-edge');
      
      // Add to collection of all highlighted elements
      allHighlightedElements = allHighlightedElements.union(reachableNodes).union(reachableEdges);
    }
    
    // Fade all other elements
    cy.elements().difference(allHighlightedElements).addClass('faded');
    
    // If there are matches, fit the view to show them
    if (matchingNodes.length > 0) {
      cy.fit(allHighlightedElements, 50);
    }
  }
});
