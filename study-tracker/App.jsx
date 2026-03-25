import { useState, useEffect } from "react";
import { Text, View, Button, TextInput, FlatList } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastDate, setLastDate] = useState(null);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await AsyncStorage.getItem("studyApp");
    if (data) {
      const parsed = JSON.parse(data);
      setTasks(parsed.tasks);
      setPoints(parsed.points);
      setStreak(parsed.streak);
      setLastDate(parsed.lastDate);
    }
  };

  // Save data
  useEffect(() => {
    AsyncStorage.setItem(
      "studyApp",
      JSON.stringify({ tasks, points, streak, lastDate })
    );
  }, [tasks, points, streak, lastDate]);

  const addTask = () => {
    if (!input) return;
    setTasks([...tasks, { text: input, done: false }]);
    setInput("");
  };

  const completeTask = (index) => {
    let updated = [...tasks];
    if (updated[index].done) return;

    updated[index].done = true;
    setTasks(updated);
    setPoints(points + 10);

    const today = new Date().toDateString();

    if (lastDate) {
      const diff =
        (new Date(today) - new Date(lastDate)) / (1000 * 60 * 60 * 24);

      if (diff === 1) setStreak(streak + 1);
      else if (diff > 1) setStreak(1);
    } else {
      setStreak(1);
    }

    setLastDate(today);
  };

  const useFreeze = () => {
    if (points >= 50) {
      setPoints(points - 50);
      alert("Streak Saved 🔥");
    } else {
      alert("Not enough points ❌");
    }
  };

  return (
    <View style={{ padding: 30 }}>
      <Text style={{ fontSize: 24 }}>Study Tracker</Text>

      <Text>🔥 Streak: {streak}</Text>
      <Text>⭐ Points: {points}</Text>

      <Button title="Use 50 Points (Save Streak)" onPress={useFreeze} />

      <TextInput
        placeholder="Enter task"
        value={input}
        onChangeText={setInput}
        style={{ borderWidth: 1, marginVertical: 10, padding: 5 }}
      />

      <Button title="Add Task" onPress={addTask} />

      <FlatList
        data={tasks}
        renderItem={({ item, index }) => (
          <View style={{ marginTop: 10 }}>
            <Text>{item.text}</Text>
            {!item.done && (
              <Button
                title="Complete"
                onPress={() => completeTask(index)}
              />
            )}
            {item.done && <Text>✅ Done</Text>}
          </View>
        )}
      />
    </View>
  );
}