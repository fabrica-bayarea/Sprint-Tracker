export async function handleFetchError(response: Response, fallbackMsg = "Erro ao fazer requisição") {
  let errorMsg = fallbackMsg;

  try {
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const data = await response.json();
      errorMsg = data.message || data.error || errorMsg;
    } else {
      const text = await response.text();
      errorMsg = text || errorMsg;
    }
  } catch {
    // ignorar erro ao tentar extrair mensagem
  }

  return errorMsg;
}