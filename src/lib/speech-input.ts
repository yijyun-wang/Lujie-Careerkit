export function appendSpeechTranscript(
  current: string,
  transcript: string,
  separator: string,
  maxLength: number,
) {
  const nextTranscript = transcript.trim();
  if (!nextTranscript) return current;
  const prefix = current && !current.endsWith(separator) ? `${current}${separator}` : current;
  return `${prefix}${nextTranscript}`.slice(0, maxLength);
}

export function speechRecognitionErrorMessage(error: string) {
  if (error === "not-allowed" || error === "service-not-allowed") {
    return "無法使用麥克風許可權，請在瀏覽器設定中允許後重試。";
  }
  if (error === "no-speech") return "沒有識別到語音，請靠近麥克風後重試。";
  if (error === "audio-capture") return "瀏覽器語音識別沒有接管到麥克風，請確認系統預設輸入裝置可用後重試。";
  if (error === "network") return "語音識別網路連線失敗，請稍後重試。";
  if (error === "aborted") return "語音輸入已停止。";
  return "語音識別失敗，請稍後重試。";
}
