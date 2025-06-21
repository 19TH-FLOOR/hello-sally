/**
 * 초를 시간/분/초 형식으로 포맷팅합니다. (0인 단위는 표시하지 않음)
 * 
 * @param {number} seconds 초 단위 시간
 * @returns {string} 포맷팅된 시간 문자열
 */
export const formatDuration = (seconds) => {
  if (seconds === null || seconds === undefined || seconds < 0) {
    return "0초";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];

  if (hours > 0) {
    parts.push(`${hours}시간`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}분`);
  }
  if (secs > 0 || parts.length === 0) { // 초가 0이어도 다른 단위가 없으면 "0초" 표시
    parts.push(`${secs}초`);
  }

  return parts.join(' ');
};

/**
 * 바이트를 읽기 쉬운 형식으로 포맷팅합니다.
 * 
 * @param {number} bytes 바이트 크기
 * @returns {string} 포맷팅된 크기 문자열
 */
export const formatFileSize = (bytes) => {
  if (bytes === null || bytes === undefined || bytes === 0) {
    return "0 B";
  }

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}; 