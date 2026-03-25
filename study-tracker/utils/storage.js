import AsyncStorage from "@react-native-async-storage/async-storage";

export const saveData = async (data) => {
  try {
    await AsyncStorage.setItem("studyApp", JSON.stringify(data));
  } catch (e) {
    console.log("Save error", e);
  }
};

export const loadData = async () => {
  try {
    const data = await AsyncStorage.getItem("studyApp");
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.log("Load error", e);
    return null;
  }
};