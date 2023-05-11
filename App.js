import { useState, useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { Fontisto } from "@expo/vector-icons";

import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  Button,
} from "react-native";
import { theme } from "./colors.js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@toDos";
const MENU_KEY = "@menu";

export default function App() {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(true);
  const [text, setText] = useState("");
  const [editText, setEditText] = useState("");
  const [toDos, setToDos] = useState({});
  const work = async () => {
    await AsyncStorage.setItem(MENU_KEY, "work");
    setIsWorking(true);
  };
  const travel = async () => {
    await AsyncStorage.setItem(MENU_KEY, "travel");
    setIsWorking(false);
  };

  const onChangeText = (payload) => setText(payload);
  const onChangeEditText = (payload) => setEditText(payload);

  //todo 추가
  const onSubmit = () => {
    if (!text) return;
    // const newToDos = Object.assign({}, toDos, { //객체들을 {}로 복사
    //   [Date.now()]: { text, work: isWorking },
    // });
    const newToDos = {
      ...toDos,
      [Date.now()]: { text, isWorking, complete: false, edit: false },
    };
    setToDos(newToDos);
    saveToDos(newToDos);
    setText("");
  };
  //todo 변경
  const onEditSubmit = (key) => {
    if (!editText) return;
    // const newToDos = Object.assign({}, toDos, { //객체들을 {}로 복사
    //   [Date.now()]: { text, work: isWorking },
    // });
    const newToDos = {
      ...toDos,
      [key]: { text: editText, isWorking, complete: false, edit: false },
    };
    setToDos(newToDos);
    saveToDos(newToDos);
    setText("");
  };

  //todo 저장
  const saveToDos = async (toDos) => {
    //toDos를 localStorage에 저장하기
    try {
      const jsonValue = JSON.stringify(toDos);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    } catch (e) {
      console.log("fail to save todos!");
      return;
    }
  };

  //todo 삭제
  const deleteToDo = (key) => {
    Alert.alert("삭제", "정말 삭제하시겠습니까?", [
      { text: "Cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: async () => {
          const newToDos = { ...toDos };
          delete newToDos[key];
          setToDos(newToDos);
          await saveToDos(newToDos);
        },
      },
    ]);
  };

  const completeToDo = async (key) => {
    const newToDos = { ...toDos };
    newToDos[key].complete = !newToDos[key].complete;
    setToDos(newToDos);
    await saveToDos(newToDos);
  };

  //todo 로드
  const loadToDos = async () => {
    //localStorage에 저장된 toDos를 가져오기
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      const loadData = jsonValue !== null ? JSON.parse(jsonValue) : null;
      setToDos(loadData);
      setLoading(false);

      const menuValue = await AsyncStorage.getItem(MENU_KEY);
      menuValue === "travel" ? setIsWorking(false) : setIsWorking(true);
      console.log("loadData", loadData);
    } catch (e) {
      console.log("fail to load todos!");
      return;
    }
  };

  const EditToDo = (key) => {
    if (toDos[key].complete) return;
    const newToDos = { ...toDos };
    newToDos[key].edit = true;
    setToDos(newToDos);
    setEditText(toDos[key].text);
    focusText();
  };
  const focusText = () => {
    inputRef.current.focus();
  };

  const opacity = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 5000,
      useNativeDriver: false,
      easing: Easing.linear,
    }).start();
  };

  const outText = (key) => {
    toDos[key].edit = false;
    loadToDos();
  };

  const deleteAll = () => {
    Alert.alert(
      "모두 삭제",
      `${(isWorking && "Work") || "Travel"}의 모든 리스트를 삭제하시겠습니까?`,
      [
        { text: "Cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            const newToDos = { ...toDos };
            for (const key in newToDos) {
              if (newToDos[key].isWorking === isWorking) {
                delete newToDos[key];
              }
            }

            setToDos(newToDos);
            await saveToDos(newToDos);
          },
        },
      ]
    );
  };

  useEffect(() => {
    //초기 로드 시에 toDos가져오는 함수 실행
    // AsyncStorage.removeItem(STORAGE_KEY);
    loadToDos();
  }, []);

  console.log("toDos", toDos);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={work}>
          <Text
            style={{
              ...styles.btnText,
              color: isWorking ? "#fff" : theme.grey,
            }}
          >
            Work
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={travel}>
          <Text
            style={{
              ...styles.btnText,
              color: !isWorking ? "#fff" : theme.grey,
            }}
          >
            Travel
          </Text>
        </TouchableOpacity>
      </View>
      <TextInput
        onSubmitEditing={onSubmit}
        returnKeyType="done"
        value={text}
        onChangeText={onChangeText}
        placeholder={
          isWorking ? "할 일을 작성해주세요." : "갈 곳을 작성해주세요."
        }
        blurOnSubmit={false} //return 후에도 키보드가 없어지는것을 방지
        style={styles.input}
      />
      <ScrollView>
        {toDos &&
          Object.keys(toDos).map((key) =>
            toDos[key].isWorking === isWorking ? (
              toDos[key].edit === true ? (
                <TouchableWithoutFeedback
                  onBlur={() => {
                    outText(key);
                  }}
                >
                  <View
                    key={key}
                    style={{
                      ...styles.toDo,
                      paddingVertical: 15,
                      backgroundColor: "#1A1B1D",
                    }}
                  >
                    <TextInput
                      onSubmitEditing={() => onEditSubmit(key)}
                      returnKeyType="done"
                      value={editText}
                      onChangeText={onChangeEditText}
                      ref={inputRef}
                      style={{
                        color: "#fff",
                      }}
                    />
                  </View>
                </TouchableWithoutFeedback>
              ) : (
                <View key={key} style={styles.toDo}>
                  <TouchableWithoutFeedback
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    onLongPress={() => {
                      EditToDo(key);
                    }}
                    onPressIn={handlePressIn}
                  >
                    <Text
                      style={{
                        ...styles.toDoText,
                        textDecorationLine:
                          toDos[key].complete === true
                            ? "line-through"
                            : "none",
                      }}
                    >
                      {toDos[key].text}
                    </Text>
                  </TouchableWithoutFeedback>
                  <View style={styles.toDoBtns}>
                    <TouchableOpacity onPress={() => completeToDo(key)}>
                      <View style={styles.toDoBtn}>
                        {toDos[key].complete === true ? (
                          <Fontisto
                            name="arrow-return-left"
                            size={15}
                            color="#D9D9E3"
                          />
                        ) : (
                          <Fontisto name="check" size={13} color="#D9D9E3" />
                        )}
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteToDo(key)}>
                      <View style={styles.toDoBtn}>
                        <Fontisto name="trash" size={15} color="#D9D9E3" />
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            ) : null
          )}
        {loading && <ActivityIndicator size="large" />}
      </ScrollView>

      <TouchableOpacity
        style={{
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderRadius: 10,
          borderColor: "#fff",
          paddingVertical: 10,
          paddingHorizontal: 10,
          alignSelf: "flex-end",
        }}
        onPress={deleteAll}
      >
        <Text style={{ fontSize: 15, color: "#fff" }}>Delete All</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
    paddingHorizontal: 20,
  },
  header: {
    justifyContent: "space-between",
    flexDirection: "row",
    marginTop: 30,
  },
  btnText: {
    fontSize: 38,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "white",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginVertical: 20,
    fontSize: 16,
  },
  toDo: {
    flex: 1,
    backgroundColor: theme.toDoBg,
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toDoText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    flexWrap: "wrap",
    flex: 1,
    paddingVertical: 5,
  },
  toDoBtns: {
    flexDirection: "row",
  },
  toDoBtn: {
    paddingHorizontal: 10,
  },
});
