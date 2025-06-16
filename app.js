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

        // Separate the type nodes from connected nodes
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
        const searchElement = document.getElementById('search');
        if (searchElement) {
          searchElement.value = '';
        }
        cy.elements().removeClass('highlighted connected reachable highlighted-edge connected-edge reachable-edge faded');
      });
    }

    const backButton = document.getElementById('back-to-list');
    if (backButton) {
      backButton.addEventListener('click', backToListView);
    }

    const openSubgraphViewButton = document.getElementById('openSubgraphView');
    if (openSubgraphViewButton) {
      openSubgraphViewButton.addEventListener('click', () => {
        // If no type is filtered, show a notification
        if (!currentFilteredType) {
          showNotification('Please select a node type first by clicking one of the filter buttons.', 'warning');
          return;
        }
        
        openSubgraphModal(currentFilteredType);
      });
    }

    // Event listener for notification close button
    const notificationClose = document.getElementById('notification-close');
    if (notificationClose) {
      notificationClose.addEventListener('click', hideNotification);
    }
  
    // Event listener for closing the modal
    const closeModalButton = document.querySelector('.close-modal');
    if (closeModalButton) {
      closeModalButton.addEventListener('click', () => {
        const modal = document.getElementById('subgraph-modal');
        if (modal) {
          modal.style.display = 'none';
        }
      });
    }

    // Close the modal when clicking outside of it
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
        currentFilteredType = null;
        cy.elements().removeClass('highlighted connected reachable highlighted-edge connected-edge reachable-edge faded');
        cy.fit();
        setActiveFilterButton(null); // Remove active state from all buttons
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


  // Function to open the subgraph modal
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
    
    // Initialize subgraph with just the type nodes
    initializeSubgraph(typeNodes);
    
    // Populate the table with all nodes of the selected type
    populateTypeNodesTable(typeNodes);
  }


  // Function to initialize the subgraph visualization
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
      // Detail view - use a radial layout with the detail node at the center
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
      // Use these settings to position the detail node in the center
      // and arrange connected nodes around it
      initialEnergyOnIncremental: 0.5,
      ready: function() {
        // This function is called when the layout is ready
        // We can use it to ensure the detail node is positioned well
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
        // {
        //   selector: 'node:hover',
        //   style: {
        //     'border-width': 2,
        //     'border-color': '#ff7f00'
        //   }
        // },
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
            // 'border-width': 3,
            // 'border-color': '#ff0000',
            'z-index': 30
          }
        }
      ],
      layout: layoutOptions,
      
      // Disable node dragging and configure interaction options
      // userZoomingEnabled: true,
      // userPanningEnabled: true,
      // boxSelectionEnabled: false,
      // selectionType: 'single',
      // autoungrabify: true,  // This prevents nodes from being grabbed/dragged
      // autounselectify: false  // We still want nodes to be selectable
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
    
    // Prevent any node dragging behavior
    // window.subgraphCy.on('mousedown', 'node', function(evt) {
    //   // Prevent the default mousedown behavior which initiates dragging
    //   evt.preventDefault();
    // });
    
    // Ensure all nodes are ungrabifiable
    // window.subgraphCy.nodes().ungrabify();
    
    // Fit the view
    setTimeout(() => {
      window.subgraphCy.fit();
    }, 100);
  }


  // Function to populate the table with all nodes of the selected type
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


  // Function to show detail view for a specific node
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
    
    // Create a collection with just the detail node
    const detailNodeCollection = cy.collection().add(detailNode);
    
    // Reinitialize subgraph with ONLY the detail node and its connections
    initializeSubgraph(detailNodeCollection, detailNode, connectedNodes, connectedEdges);
    
    // Initially show the node details
    updateNodeDetailsTable(detailNode);
  }


  // Function to populate the table with connections for a specific node
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
    
    // Add a back to details button
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
        let relationship = edge.data('label') || 'connected to';
        if (edge.source().id() === detailNode.id()) {
          relationship += ' &rarr;'; // Outgoing
        } else {
          relationship += ' &larr;'; // Incoming
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
        
        tableBody.appendChild(row);
      });
    });
  }


  // Function to highlight connections in the subgraph
  function highlightConnections(node) {
    if (!window.subgraphCy) return;
    
    // Reset all styles
    window.subgraphCy.elements().removeClass('highlighted connected-edge');
    
    // Highlight the selected node
    node.addClass('highlighted');
    
    // Highlight connected edges and nodes
    const connectedEdges = node.connectedEdges();
    connectedEdges.addClass('connected-edge');
    
    const connectedNodes = connectedEdges.connectedNodes().filter(n => n.id() !== node.id());
    connectedNodes.addClass('highlighted');
    
    // Update the table to show node details
    updateNodeDetailsTable(node);
  }


  // Function to update the table with node details
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
            <td colspan="2"><a href="${value}" target="_blank" rel="noopener noreferrer">${value}</a></td>
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
      
      // Add a button to view all connections
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
  }


  // Function to go back to the list view
  function backToListView() {
    // Reset current detail node
    currentDetailNode = null;
    
    // Hide back button
    const backButton = document.getElementById('back-to-list');
    if (backButton) {
      backButton.style.display = 'none';
    }
    
    // Reinitialize subgraph with just the type nodes
    initializeSubgraph(allTypeNodes);
    
    // Repopulate the table with all nodes of the selected type
    populateTypeNodesTable(allTypeNodes);
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


  // Function to show a notification instead of using alert
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


  // Function to hide the notification with animation
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


  // Convenience functions for different notification types
  function showErrorNotification(message, duration = 4000) {
    showNotification(message, 'error', duration);
  }


  function showSuccessNotification(message, duration = 3000) {
    showNotification(message, 'success', duration);
  }


  function showWarningNotification(message, duration = 3500) {
    showNotification(message, 'warning', duration);
  }

