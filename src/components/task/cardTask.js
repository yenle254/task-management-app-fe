import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Mouse from "../../../assets/icons/mouse.svg";
import Colors from "../../styles/color";
import AppButton from "./../appButton";
import ProgressBar from "./../progressBar";
import TaskCategory from "./../taskCategory";
import Avatar from "../avatar";

const CardTask = ({ 
  name, 
  endDate, 
  comment, 
  progress, 
  category, 
  flag, 
  bgColor,
  assignees = [],
  description = ""
}) => {
  const bgColors = bgColor;

  const getStatusDisplay = (status) => {
    const statusMap = {
      'todo': { text: 'To Do', color: '#667085', bgColor: '#F2F4F7' },
      'in_progress': { text: 'In Progress', color: '#0284C7', bgColor: '#E0F2FE' },
      'done': { text: 'Done', color: '#16A34A', bgColor: '#DCFCE7' }
    };
    return statusMap[status] || statusMap['todo'];
  };
  
  const getPriorityInfo = (priority) => {
    const priorityMap = {
      'high': { text: 'High', color: '#fe3b3bff'},
      'medium': { text: 'Medium', color: '#eda11eff'},
      'low': { text: 'Low', color: '#10c78aff'}
    };
    return priorityMap[priority] || '#F59E0B';
  };

  const statusInfo = getStatusDisplay(category);
  const priorityInfo = getPriorityInfo(flag);

  const renderAssignees = () => {
    if (!assignees || assignees.length === 0) return null;

    const displayedAssignees = assignees.slice(0, 3);
    const remainingCount = assignees.length - 3;

    return (
      <View style={styles.assigneesContainer}>
        {displayedAssignees.map((assignee, index) => (
          <View 
            key={assignee._id || index} 
            style={[styles.avatarContainer, { marginLeft: index > 0 ? -8 : 0 }]}
          >
            {assignee.profile?.avatar ? (
              <Avatar 
                url={assignee.profile.avatar} 
                name={assignee.profile?.fullName || assignee.email} 
                width={24} 
                height={24} 
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {assignee.profile?.fullName?.charAt(0).toUpperCase() || 
                   assignee.email?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </View>
        ))}
        {remainingCount > 0 && (
          <View style={[styles.avatarContainer, styles.avatarPlaceholder, { marginLeft: -8 }]}>
            <Text style={styles.avatarText}>+{remainingCount}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { backgroundColor: bgColors || Colors.frame }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Mouse width={24} height={24} />
            <Text style={styles.nameText} numberOfLines={1}>
              {name}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <AppButton text="Details" />
          </View>
        </View>
        
        <View style={styles.body}>
          <View style={styles.progress}>
            <TaskCategory
              icon={category}
              name={statusInfo.text}
              textColor={statusInfo.color}
              bgColor={statusInfo.bgColor}
            />
            <TaskCategory
              icon="flag"
              name={priorityInfo.text}
              bgColor={priorityInfo.color}
              textColor="white"
            />
          </View>

          {/* Description */}
          {description && description.trim() !== "" && (
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          )}
          
          <View style={styles.footer}>
            <ProgressBar progress={progress} />
            
            <View style={styles.footerBottom}>
              <View style={styles.commentSection}>
                <TaskCategory
                  icon="calendar_task"
                  name={endDate}
                  bgColor="#F0ECFE"
                />
                <TaskCategory 
                  icon="comment" 
                  name={comment} 
                  bgColor="#F0ECFE" 
                />
              </View>
              
              {renderAssignees()}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default CardTask;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
  },
  container: {
    backgroundColor: Colors.frame,
    borderRadius: 15,
    padding: 10,
    width: "100%",
    gap: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    alignContent: "center",
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  nameText: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  body: {
    gap: 8,
  },
  progress: {
    flexDirection: "row",
    gap: 8,
  },
  description: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    marginTop: 4,
  },
  footer: {
    marginTop: 10,
    gap: 12,
  },
  footerBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  commentSection: {
    flexDirection: "row",
    gap: 8,
  },
  assigneesContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    borderWidth: 2,
    borderColor: Colors.white,
    borderRadius: 12,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "600",
  },
});