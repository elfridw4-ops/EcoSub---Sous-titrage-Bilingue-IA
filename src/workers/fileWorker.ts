self.onmessage = async (e) => {
  const { file, id } = e.data;
  
  try {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      self.postMessage({ id, base64 });
    };
    reader.onerror = (error) => {
      self.postMessage({ id, error: 'Failed to read file' });
    };
  } catch (error) {
    self.postMessage({ id, error: error.message });
  }
};
