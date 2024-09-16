# ChatGPT UI using OpenAI API

## Description
This project provides a user-friendly interface for interacting with the OpenAI ChatGPT API. The API key is securely encoded with a passkey and stored in the repository. Only users with the passkey can decode and utilize the API, ensuring secure access.

## Features
- **Secure API Key Storage**: The API key is encoded and can only be accessed with a passkey.
- **Intuitive User Interface**: A clean and responsive UI built with modern web technologies.
- **Voice and Text Interaction**: Supports both text and voice inputs for a seamless user experience.
- **Real-time Chat**: Engage in real-time conversations with the ChatGPT model.
- **Markdown and Code Highlighting**: Supports markdown rendering and syntax highlighting for code snippets.
- **Image and Audio Processing**: Integrates with Google Vision API for OCR and OpenAI's Whisper for speech-to-text.
- **Downloadable Chat History**: Export chat history in Markdown, HTML, or Python formats.
- **Customizable Settings**: Adjust settings like model type, temperature, and more.

## Installation
To set up the project, follow these steps:

1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/chatgpt-ui.git
   cd chatgpt-ui
   ```

2. Install dependencies:
   ```sh
   yarn install
   ```

3. Build the project:
   ```sh
   yarn build
   ```

4. Deploy the production-ready site using the workflow defined in [gh-pages.yml](.github/workflows/gh-pages.yml).

## Usage
1. Open the website from your deployed URL.
2. Enter the passkey to decode the API key.
3. Enjoy the intuitive UI to interact with ChatGPT.

## Contributing
Contributions are welcome! Please fork the repository and submit a pull request.

## License
This project is licensed under the MIT License.