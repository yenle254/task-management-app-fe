import { StyleSheet } from 'react-native';
import Colors from '../../../src/styles/color';

export const copilotScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white
  },
  flexOne: {
    flex: 1
  },
  roleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f3f0ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  roleBannerText: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '500',
    flex: 1
  },
  resetBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#ede9fe'
  },
  resetBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 14
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8
  },
  userRow: {
    justifyContent: 'flex-end'
  },
  assistantRow: {
    justifyContent: 'flex-start'
  },
  botAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4
  },
  assistantBubble: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  typingText: {
    fontSize: 13,
    color: '#6b7280'
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#1f2937'
  },
  userMessageText: {
    color: Colors.white
  },
  boldText: {
    fontWeight: '700',
    color: '#111827'
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: 8
  },
  timestamp: {
    fontSize: 11,
    color: '#9ca3af'
  },
  userTimestamp: {
    color: '#e0e7ff'
  },
  providerBadge: {
    fontSize: 10,
    color: Colors.primary,
    backgroundColor: '#f3f0ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden'
  },
  suggestionsSection: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingVertical: 8
  },
  suggestionsScroll: {
    paddingHorizontal: 12,
    gap: 8
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    maxWidth: 300
  },
  suggestionChipText: {
    fontSize: 12,
    color: '#4c1d95',
    fontWeight: '500'
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8
  },
  textInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827'
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: '#cbd5e1'
  }
});

export const actionCardStyles = StyleSheet.create({
  actionCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
    gap: 8
  },
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  actionCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4c1d95',
    flex: 1
  },
  actionCardSummary: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18
  },
  confirmActionButton: {
    marginTop: 4,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  confirmActionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700'
  },
  completedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: '#dcfce7',
    padding: 8,
    borderRadius: 8
  },
  completedText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
    flex: 1
  },
  openTaskLink: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#15803d',
    borderRadius: 6
  },
  openTaskLinkText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600'
  }
});

export const breakdownPanelStyles = StyleSheet.create({
  wrapper: {
    marginVertical: 8,
    gap: 10
  },
  buttonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  breakdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    flexGrow: 1
  },
  breakdownButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13
  },
  summaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    flexGrow: 1
  },
  summaryButtonText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 13
  },
  card: {
    backgroundColor: '#f8f7ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
    borderRadius: 12,
    padding: 14,
    gap: 8
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4c1d95',
    flex: 1
  },
  closeText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600'
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  badge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5b21b6'
  },
  headlineText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827'
  },
  reasoningText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#4b5563'
  },
  subHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 4
  },
  bodyText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 19
  },
  bulletText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 19,
    paddingLeft: 4
  },
  applyButton: {
    marginTop: 8,
    backgroundColor: '#16a34a',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700'
  }
});

