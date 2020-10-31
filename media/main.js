/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-undef */
// @ts-nocheck

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  // Gets the vs code api
  const vscode = acquireVsCodeApi();

  const log = (message) => vscode.postMessage({ type: 'log', value: message });

  const welcomeMessage =
    '# Welcome to `sidebar-markdown-notes`\n\nStart by typing **markdown**.\n\nClick the `Toggle preview` button to view your notes\n\nAlso works with GitHub Flavored Markdown ✨✨\n- [ ] Start by  \n- [ ] creating your own  \n- [x] checklists!  \n\nOr any kind of markdown\n\n- Your imagination  \n- Is the limit';

  const initialState = {
    state: 'editor',
    currentPage: 0,
    pages: [welcomeMessage],
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
    },
    checkbox(checked) {
      return '<input ' + (checked ? 'checked="" ' : '') + 'type="checkbox"' + (this.options.xhtml ? ' /' : '') + '> ';
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
        renderElement.innerHTML = DOMPurify.sanitize(marked(content || ''));

        // Display the markdown render
        renderElement.style.display = 'initial';

        // Hide the editor
        editorElement.style.display = 'none';

        document
          .querySelectorAll(`input[type='checkbox']`)
          .forEach((check) => check.addEventListener('click', (e) => e.preventDefault()));
        break;
      }
      case 'editor': {
        // If we want to render the text editor

        // Grabs the text input
        const editorTextArea = document.getElementById('editor-input');

        // Put the value in the input
        editorTextArea.value = content || '';

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

    switch (currentState.state) {
      case 'render': {
        break;
      }
      case 'editor': {
        // If the current state is the editor

        // Get the editor text area
        const editorTextArea = document.getElementById('editor-input');

        // Make a state with the typed in value
        newState = {
          ...newState,
          pages: [
            ...newState.pages.slice(0, newState.currentPage),
            editorTextArea.value,
            ...newState.pages.slice(newState.currentPage + 1)
          ]
        };
        break;
      }
    }

    saveState(newState);
  };

  const debouncedSaveContent = _.debounce(() => saveContent(), 300, {
    maxWait: 500
  });

  const togglePreview = () => {
    // Grabs the new state
    let newState = { ...currentState, state: currentState.state === 'editor' ? 'render' : 'editor' };
    saveState(newState);

    saveContent();

    // Renders the view, which will render the next view
    renderView();
  };

  const previousPage = () => {
    saveContent();
    if (currentState.currentPage > 0) {
      let newState = { ...currentState, currentPage: currentState.currentPage - 1 };
      saveState(newState);

      // Renders the view, which will render the next view
      renderView();

      log(`Page ${newState.currentPage + 1}`);
    } else {
      log('First page');
    }
  };

  const nextPage = () => {
    saveContent();
    if (currentState.currentPage <= 999) {
      const newPageIndex = Number(currentState.currentPage) + 1;

      let newState = {
        ...currentState,
        currentPage: newPageIndex,
        pages: currentState.pages[newPageIndex]
          ? currentState.pages
          : [...currentState.pages, `Page ${newPageIndex + 1}\n${welcomeMessage}`]
      };
      saveState(newState);

      // Renders the view, which will render the next view
      renderView();

      log(`Page ${newPageIndex + 1}`);
    }
  };

  // Handle messages sent from the extension to the webview
  window.addEventListener('message', (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.type) {
      case 'togglePreview': {
        // If the editor sends a togglePreview message
        togglePreview();
        break;
      }
      case 'previousPage': {
        previousPage();
        break;
      }
      case 'nextPage': {
        nextPage();
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
