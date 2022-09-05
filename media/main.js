/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-undef */
// @ts-nocheck

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  // Gets the vs code api
  const vscode = acquireVsCodeApi();

  const log = (message) => vscode.postMessage({ type: 'log', value: message });

  const updateStatusBar = (message) => vscode.postMessage({ type: 'updateStatusBar', value: message });
  updateStatusBar('');

  let timeoutId;
  const updateStatusForSeconds = (message, secondsToHide) => {
    updateStatusBar(message);

    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }

    timeoutId = setTimeout(() => {
      updateStatusBar('');
    }, secondsToHide || 3000);
  };

  const welcomeMessage =
    '# Welcome to `sidebar-markdown-notes`\n\nStart by typing **markdown**.\n\nClick the `Toggle preview` button to view your notes\n\nAlso works with GitHub Flavored Markdown ✨✨\n- [ ] Start by  \n- [ ] creating your own  \n- [x] checklists!  \n\nOr any kind of markdown\n\n- Your imagination  \n- Is the limit';

  const initialState = {
    state: 'editor',
    currentPage: 0,
    pages: [welcomeMessage],
    version: 1
  };

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
    const editorElement = document.getElementById('content');

    // Gets the latest markdown content
    const content = currentState.pages[currentState.currentPage];

    switch (currentState.state) {
      case 'render': {
        // If we want to render the markdown

        // Grab the html for the markdown
        renderElement.innerHTML = DOMPurify.sanitize(marked(content || ''));

        if (renderElement.classList.contains('hidden')) {
          renderElement.classList.remove('hidden');
        }
        editorElement.classList.add('hidden');

        document.querySelectorAll(`input[type='checkbox']`).forEach((check) => {
          // So we can lookup the checkbox in the markdown content
          const content = check.parentElement.textContent.trim();
          const getIsChecked = () => currentState.pages[currentState.currentPage].includes(`- [x] ${content}`);

          // Ensure the checkbox state matches what is in the latest markdown
          check.checked = getIsChecked();

          check.addEventListener('click', () => {
            const checked = getIsChecked();

            // Update the markdown to use the new checked state
            // Best to just rely on the markdown as the source of truth rather
            // than trying to juggle some internal state for the checkbox
            const newPageContent = checked
              ? // Was checked - should now uncheck
                currentState.pages[currentState.currentPage].replaceAll(`- [x] ${content}`, `- [ ] ${content}`)
              : // Was not checked - should now check
                currentState.pages[currentState.currentPage].replaceAll(`- [ ] ${content}`, `- [x] ${content}`);

            let newState = {
              ...currentState,
              pages: [
                ...currentState.pages.slice(0, currentState.currentPage),
                newPageContent,
                ...currentState.pages.slice(currentState.currentPage + 1)
              ]
            };

            saveState(newState);
          });
        });
        break;
      }
      case 'editor': {
        // If we want to render the text editor

        // Grabs the text input
        const editorTextArea = document.getElementById('text-input');

        // Put the value in the input
        editorTextArea.value = content || '';

        if (editorElement.classList.contains('hidden')) {
          editorElement.classList.remove('hidden');
        }
        renderElement.classList.add('hidden');
        break;
      }
    }
  };

  const saveState = (newState) => {
    // Save the state
    vscode.setState(newState);
    // Updates current instance
    currentState = newState;

    renderView();
  };

  const getUpdatedContent = () => {
    let newState = { ...currentState };

    switch (currentState.state) {
      case 'render': {
        break;
      }
      case 'editor': {
        // If the current state is the editor

        // Get the editor text area
        const editorTextArea = document.getElementById('text-input');

        // Updates the value in state only if they're different
        if (editorTextArea.value !== newState.pages[newState.currentPage]) {
          // Make a state with the typed in value
          newState = {
            ...newState,
            pages: [
              ...newState.pages.slice(0, newState.currentPage),
              editorTextArea.value,
              ...newState.pages.slice(newState.currentPage + 1)
            ]
          };
        }

        break;
      }
    }

    return newState;
  };

  const debouncedSaveContent = _.debounce(() => saveState(getUpdatedContent()), 300, {
    maxWait: 500
  });

  const togglePreview = () => {
    // Grabs the new state
    let newState = { ...getUpdatedContent(), state: currentState.state === 'editor' ? 'render' : 'editor' };
    saveState(newState);
  };

  const previousPage = () => {
    if (currentState.currentPage > 0) {
      let newState = { ...getUpdatedContent(), currentPage: currentState.currentPage - 1 };

      saveState(newState);

      updateStatusForSeconds(`$(file) Page ${newState.currentPage + 1}`);
    } else {
      updateStatusForSeconds(`$(file) Page ${currentState.currentPage + 1}`);
      log(`You're already at the first page`);
    }
  };

  const nextPage = () => {
    if (currentState.currentPage <= 999) {
      const newPageIndex = Number(currentState.currentPage) + 1;

      let newState = {
        ...getUpdatedContent(),
        currentPage: newPageIndex
      };

      if (!currentState.pages[newPageIndex]) {
        newState = { ...newState, pages: [...newState.pages, `Page ${newPageIndex + 1}\n${welcomeMessage}`] };
      }

      saveState(newState);

      updateStatusForSeconds(`$(file) Page ${newPageIndex + 1}`);
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
      case 'resetData': {
        saveState(initialState);
        break;
      }
    }
  });

  document.getElementById('text-input').addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      // prevent the focus lose on tab press
      event.preventDefault();
    }
  });

  document.getElementById('text-input').addEventListener('input', () => {
    debouncedSaveContent();
  });

  // Runs the render for the first time
  renderView();
})();
