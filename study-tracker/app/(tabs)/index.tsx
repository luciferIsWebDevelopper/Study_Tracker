import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  Modal,
} from "react-native";

import { Calendar } from "react-native-calendars";
import { Audio } from "expo-av";

import { saveData, loadData } from "../../utils/storage";
import { parseTasksFromText } from "../../utils/parser";
import { motivationMessages } from "@/utils/gamification";

export default function Home() {
  const [items, setItems] = useState<any[]>([]);
  const [bulkText, setBulkText] = useState("");

  const [points, setPoints] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(5);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);

  const [streak, setStreak] = useState(0);
  const [lastCompletedDate, setLastCompletedDate] = useState<string | null>(
    null,
  );

  const [dailyStats, setDailyStats] = useState<{ [key: string]: number }>({});

  const [showMagic, setShowMagic] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("Great Job!");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const data = await loadData();
    if (data) {
      setItems(data.items || []);
      setPoints(data.points || 0);
      setStreak(data.streak || 0);
      setLastCompletedDate(data.lastCompletedDate || null);
    }
  };

  useEffect(() => {
    saveData({ items, points, streak, lastCompletedDate });
  }, [items, points, streak, lastCompletedDate]);

  const playSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require("../../assets/ding.mp3"),
    );
    await sound.playAsync();

    sound.setOnPlaybackStatusUpdate((status) => {
      if ((status as any).didJustFinish) {
        sound.unloadAsync();
      }
    });
  };
  const getTasksForDate = (dateString: string) => {
    const target = new Date(dateString).toDateString();

    return items.filter(
      (item) =>
        item.type === "task" && new Date(item.dayId).toDateString() === target,
    );
  };
  const checkAchievements = (updatedItems: any[]) => {
    const completed = updatedItems.filter(
      (i) => i.type === "task" && i.done,
    ).length;

    const arr = [];
    if (completed >= 1) arr.push("First Task 🎉");
    if (completed >= 10) arr.push("10 Tasks 💪");
    if (streak >= 7) arr.push("7 Day Streak 🔥");

    setAchievements([...new Set(arr)]);
  };

  const checkSectionCompletion = (updatedItems: any[]) => {
    const sections = ["Programming", "DSA", "MLOps", "System", "Industry"];
    let newCompleted = [...completedSections];

    sections.forEach((section) => {
      const tasks = updatedItems.filter(
        (i) => i.type === "task" && i.section === section,
      );

      if (
        tasks.length &&
        tasks.every((t) => t.done) &&
        !completedSections.includes(section)
      ) {
        setDailyGoal((p) => p + 1);
        newCompleted.push(section);
      }
    });

    setCompletedSections(newCompleted);
  };

  const updateStreak = () => {
    const today = new Date().toDateString();

    if (!lastCompletedDate) {
      setStreak(1);
      setLastCompletedDate(today);
      return;
    }

    const diff =
      (new Date().getTime() - new Date(lastCompletedDate).getTime()) /
      (1000 * 60 * 60 * 24);

    if (diff < 1) return;
    if (diff < 2) setStreak((p) => p + 1);
    else setStreak(1);

    setLastCompletedDate(today);
  };

  const generateTasks = () => {
    if (!bulkText) return;

    setShowMagic(true);

    const parsed = parseTasksFromText(bulkText);
    const dayId = Date.now();

    setItems([...items, ...parsed.map((i) => ({ ...i, dayId }))]);
    setBulkText("");

    setTimeout(() => setShowMagic(false), 800);
  };

  const completeTask = (id: number) => {
    let first = false;

    const updated = items.map((item) => {
      if (item.type === "task" && item.id === id && !item.done) {
        first = true;
        setPoints((p) => p + 10);
        return { ...item, done: true };
      }
      return item;
    });

    setItems(updated);
    checkAchievements(updated);
    checkSectionCompletion(updated);

    if (first) updateStreak();

    const today = new Date().toDateString();
    setDailyStats((p) => ({ ...p, [today]: (p[today] || 0) + 1 }));

    const msg =
      motivationMessages[Math.floor(Math.random() * motivationMessages.length)];
    setCurrentMessage(msg);

    playSound();

    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 900);
  };

  const deleteDay = (dayId: number) => {
    Alert.alert("Delete?", "Confirm", [
      { text: "Cancel" },
      {
        text: "Delete",
        onPress: () => setItems(items.filter((i) => i.dayId !== dayId)),
      },
    ]);
  };

  const days = [...new Set(items.map((i) => i.dayId))];
  const todayTasks = items.filter((i) => i.type === "task" && i.done).length;

  const getMarkedDates = () => {
    const result: any = {};

    Object.entries(dailyStats).forEach(([date, count]) => {
      const d = new Date(date);
      if (isNaN(d.getTime())) return;

      const key = d.toISOString().split("T")[0];

      result[key] = {
        marked: true,
        dotColor: count > 0 ? "#58cc02" : "#ccc",
        ...(count > 0 && {
          customStyles: {
            container: {
              backgroundColor: "#e6f7e6",
              borderRadius: 8,
            },
            text: {
              color: "#000",
              fontWeight: "bold",
            },
          },
        }),
      };
    });

    return result;
  };
  const isStreakDay = (dateString: string) => {
    const dates = Object.keys(dailyStats)
      .map((d) => new Date(d).toDateString())
      .sort();

    return dates.includes(new Date(dateString).toDateString());
  };

  return (
    <>
      <Modal visible={showMagic} transparent>
        <View style={styles.overlay}>
          <Text style={{ fontSize: 60 }}>🧙‍♀️</Text>
          <Text style={styles.magic}>Abrakadabra!</Text>
        </View>
      </Modal>

      <Modal visible={showCelebration} transparent>
        <View style={styles.overlay}>
          <Text style={{ fontSize: 60 }}>🎉</Text>
          <Text style={styles.magic}>{currentMessage}</Text>
        </View>
      </Modal>

      <ScrollView style={{ padding: 20 }}>
        <Pressable
          onPress={() => setShowCalendar(true)}
          style={{
            backgroundColor: "#1cb0f6",
            padding: 10,
            borderRadius: 8,
            marginVertical: 10,
          }}
        >
          <Text style={{ color: "white", textAlign: "center" }}>
            Open Calendar 📅
          </Text>
        </Pressable>
        <Text style={{ fontSize: 26 }}>Study App</Text>

        <Text>⭐ XP: {points}</Text>
        <Text>
          {streak > 0 ? "🔥".repeat(Math.min(streak, 5)) : ""} {streak} Day
          Streak
        </Text>

        <Text>
          🎯 Goal: {todayTasks}/{dailyGoal}
        </Text>

        <View style={styles.bar}>
          <View
            style={[
              styles.fill,
              { width: `${Math.min((todayTasks / dailyGoal) * 100, 100)}%` },
            ]}
          />
        </View>

        <TextInput
          value={bulkText}
          onChangeText={setBulkText}
          multiline
          style={styles.input}
        />

        <Pressable onPress={generateTasks} style={styles.btn}>
          <Text style={styles.btnText}>Generate</Text>
        </Pressable>

        {days.map((dayId) => {
          const dayItems = items.filter((i) => i.dayId === dayId);

          return (
            <View key={dayId}>
              <Pressable onPress={() => deleteDay(dayId)} style={styles.delete}>
                <Text style={styles.btnText}>Delete Day</Text>
              </Pressable>

              {dayItems.map((item) => {
                if (item.type === "section")
                  return <Text key={item.title}>📂 {item.title}</Text>;

                if (item.type === "task") {
                  const sectionTasks = dayItems.filter(
                    (i) => i.type === "task" && i.section === item.section,
                  );

                  const indexInSection = sectionTasks.findIndex(
                    (t) => t.id === item.id,
                  );

                  // 🔒 LOCK LOGIC
                  const isLocked =
                    indexInSection !== 0 &&
                    !sectionTasks[indexInSection - 1]?.done;

                  const isCompleted = item.done;
                  const isCurrent = !isLocked && !isCompleted;

                  // 🔀 ZIG-ZAG
                  const isLeft = indexInSection % 2 === 0;

                  // 🎨 COLORS
                  let bgColor = "#ccc"; // locked
                  if (isCompleted)
                    bgColor = "#58cc02"; // green
                  else if (isCurrent) bgColor = "#1cb0f6"; // blue

                  return (
                    <View
                      key={item.id}
                      style={{
                        flexDirection: "row",
                        justifyContent: isLeft ? "flex-start" : "flex-end",
                        marginVertical: 15,
                      }}
                    >
                      <View style={{ width: "70%" }}>
                        {/* 🔵 CIRCLE */}
                        <Pressable
                          onPress={() => {
                            if (!isLocked) completeTask(item.id);
                          }}
                          style={{
                            width: 90,
                            height: 90,
                            borderRadius: 45,
                            backgroundColor: bgColor,
                            justifyContent: "center",
                            alignItems: "center",
                            alignSelf: isLeft ? "flex-start" : "flex-end",
                          }}
                        >
                          <Text style={{ color: "white", fontSize: 18 }}>
                            {isCompleted ? "✓" : indexInSection + 1}
                          </Text>
                        </Pressable>

                        {/* 📄 TEXT */}
                        <Text style={{ textAlign: isLeft ? "left" : "right" }}>
                          {item.text}
                        </Text>

                        {/* BUTTON */}
                        {!isCompleted && (
                          <Pressable
                            onPress={() => !isLocked && completeTask(item.id)}
                            style={{
                              marginTop: 5,
                              backgroundColor: isLocked ? "#ccc" : "#1cb0f6",
                              padding: 10,
                              borderRadius: 8,
                              alignItems: "center",
                            }}
                          >
                            <Text style={{ color: "white" }}>
                              {isLocked ? "Locked" : "Complete"}
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  );
                }

                return <Text key={item.id}>💡 {item.text}</Text>;
              })}
            </View>
          );
        })}
      </ScrollView>
      <Modal visible={showCalendar} animationType="slide">
        <View style={{ flex: 1, padding: 20 }}>
          <Text style={{ fontSize: 22, marginBottom: 10 }}>
            📅 Your Activity
          </Text>
          <Calendar
            markingType={"custom"}
            markedDates={getMarkedDates()}
            onDayPress={(day) => {
              setSelectedDate(day.dateString);
            }}
          />
          {selectedDate && (
            <View style={{ marginTop: 20 }}>
              <Text style={{ fontSize: 18, marginBottom: 10 }}>
                📅 Tasks on {selectedDate}
              </Text>

              {getTasksForDate(selectedDate).length === 0 ? (
                <Text>No tasks</Text>
              ) : (
                getTasksForDate(selectedDate).map((task) => (
                  <Text key={task.id}>
                    {task.done ? "✅" : "⬜"} {task.text}
                  </Text>
                ))
              )}
            </View>
          )}
          <Pressable
            onPress={() => setShowCalendar(false)}
            style={{
              marginTop: 20,
              backgroundColor: "red",
              padding: 10,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "white", textAlign: "center" }}>Close</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = {
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  magic: { color: "white", fontSize: 20 },
  input: { borderWidth: 1, marginVertical: 10, padding: 10 },
  btn: { backgroundColor: "#1cb0f6", padding: 10, marginVertical: 5 },
  btnText: { color: "white", textAlign: "center" },
  delete: { backgroundColor: "red", padding: 8, marginVertical: 10 },
  bar: { height: 10, backgroundColor: "#ddd", marginVertical: 5 },
  fill: { height: 10, backgroundColor: "#1cb0f6" },
};
