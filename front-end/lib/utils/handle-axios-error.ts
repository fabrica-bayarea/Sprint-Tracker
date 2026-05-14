import axios from 'axios';

export function handleAxiosError(error: unknown, fallbackMsg = "Erro ao fazer requisição") {
  let errorMsg = fallbackMsg;

  if (axios.isAxiosError(error)) {
    if (error.response?.data) {
      const data = error.response.data;
      if (typeof data === 'string') {
        errorMsg = data;
      } else {
        errorMsg = data.message || data.error || errorMsg;
      }
    }
  } else if (error instanceof Error) {
    errorMsg = error.message;
  }

  return errorMsg;
}
