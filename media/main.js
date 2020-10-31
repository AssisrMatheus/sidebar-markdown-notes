/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-undef */
// @ts-nocheck

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  // Gets the vs code api
  const vscode = acquireVsCodeApi();

  const initialState = {
    state: 'editor',
    currentPage: 0,
    pages: [
      '# Welcome to `sidebar-markdown-notes`\n\nStart by typing **markdown**.\n\nClick the `Switch preview` button to view your notes\n\nAlso works with GitHub Flavored Markdown ✨✨\n- [ ] Start by  \n- [ ] creating your own  \n- [x] checklists!  \n'
    ],
    version: 1
  };

  vscode.setState(initialState);

  // Gets the state or creates a new one if it doesn't exist
  let currentState = vscode.getState() || initialState;

  // Set the options for the maked markdown parser
  marked.setOptions({
    gfm: true,
    breaks: true
  });

  // Creates custom renderers for the marked markdown
  const renderer = {
    // Ref: https://github.com/markedjs/marked/blob/master/src/Renderer.js
    list(body, ordered, start) {
      const type = ordered ? 'ol' : 'ul',
        startatt = ordered && start !== 1 ? ' start="' + start + '"' : '',
        hasTodo = body.match(/checkbox/i) ? ' class="todoList"' : ''; // If there's a checkbox, adds a "todoList" class
      return '<' + type + startatt + hasTodo + '>\n' + body + '</' + type + '>\n';
    }
  };

  // Use the created renderer
  marked.use({ renderer });

  // This method will render the webview
  const renderView = () => {
    // Grabs the elements
    const renderElement = document.getElementById('render');
    const editorElement = document.getElementById('editor');

    // Gets the latest markdown content
    const content = currentState.pages[currentState.currentPage];

    switch (currentState.state) {
      case 'render': {
        // If we want to render the markdown

        // Grab the html for the markdown
        renderElement.innerHTML = DOMPurify.sanitize(marked(content));

        // Display the markdown render
        renderElement.style.display = 'initial';

        // Hide the editor
        editorElement.style.display = 'none';
        break;
      }
      case 'editor': {
        // If we want to render the text editor

        // Grabs the text input
        const editorTextArea = document.getElementById('editor-input');

        // Put the value in the input
        editorTextArea.value = content;

        // Hide the markdown render
        renderElement.style.display = 'none';

        // Display the editor
        editorElement.style.display = 'initial';
        break;
      }
    }
  };

  const saveState = (newState) => {
    // Save the state
    vscode.setState(newState);
    // Updates current instance
    currentState = newState;
  };

  const saveContent = () => {
    let newState = { ...currentState };

    console.log('saving content');

    switch (currentState.state) {
      case 'render': {
        break;
      }
      case 'editor': {
        // If the current state is the editor

        // Get the editor text area
        const editorTextArea = document.getElementById('editor-input');

        // Make a state with the typed in value
        newState = { ...newState, pages: { ...newState.pages, [currentState.currentPage]: editorTextArea.value } };
        break;
      }
    }

    saveState(newState);
  };

  const debouncedSaveContent = _.debounce(() => saveContent(), 300, {
    maxWait: 500
  });

  const switchPreview = () => {
    // Grabs the new state
    let newState = { ...currentState, state: currentState.state === 'editor' ? 'render' : 'editor' };
    saveState(newState);

    saveContent();

    // Renders the view, which will render the next view
    renderView();
  };

  // Handle messages sent from the extension to the webview
  window.addEventListener('message', (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.type) {
      case 'switchPreview': {
        // If the editor sends a switchPreview message
        switchPreview();
        break;
      }
    }
  });

  document.getElementById('editor-input').addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      // prevent the focus lose on tab press
      event.preventDefault();
    }
  });

  document.getElementById('editor-input').addEventListener('input', () => {
    debouncedSaveContent();
  });

  // Runs the render for the first time
  renderView();
})();
