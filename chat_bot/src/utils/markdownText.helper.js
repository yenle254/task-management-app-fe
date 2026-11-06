/**
 * Split a markdown-like string into plain and **bold** segments for React Native <Text>
 * @param {string} content
 * @returns {Array<{bold: boolean, text: string}>}
 */
export const parseBoldSegments = (content = '') => {
  const parts = String(content || '').split(/(\*\*[^*]+\*\*)/g);
  return parts
    .filter((part) => part.length > 0)
    .map((part) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return { bold: true, text: part.slice(2, -2) };
      }
      return { bold: false, text: part };
    });
};

