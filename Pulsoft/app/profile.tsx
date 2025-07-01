import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '../components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import { Navbar } from '../components/Navbar';

import SplitText from "../components/js/SplitText";

const handleAnimationComplete = () => {
  console.log('All letters have animated!');
};

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            {/* 
            <Image
              source={require('../assets/images/partial-react-logo.png')}
              style={styles.profileImage}
            />
            */}
            <Image
              source={{ uri: 'https://i.kym-cdn.com/photos/images/original/002/584/508/141.gif' }}
              style={styles.profileImage}
            />
            
          </View>
          {/*
          
          <SplitText
            text="Hello, GSAP!"
            className="text-2xl font-semibold text-center"
            delay={100}
            duration={0.6}
            ease="power3.out"
            splitType="chars"
            from={{ opacity: 0, y: 40 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="-100px"
            textAlign="center"
            onLetterAnimationComplete={handleAnimationComplete}
          />
          */}

          <SplitText
           text="Hola, Juan Pérez!"
           className="name"
           delay={100}
           duration={0.6}
           ease="power3.out"
           splitType="chars"
           from={{ opacity: 0, y: 40 }}
           to={{ opacity: 1, y: 0 }}
           threshold={0.1}
           rootMargin="-100px"
           textAlign="center"
           onLetterAnimationComplete={handleAnimationComplete}
         />
          <Text style={styles.name}>Juan Pérez</Text>
          <Text style={styles.email}>juan.perez@ejemplo.com</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          <Text style={styles.infoText}>Nombre: Juan Pérez</Text>
          <Text style={styles.infoText}>Email: juan@ejemplo.com</Text>
          <Text style={styles.infoText}>Teléfono: +12 123 456 789</Text>
          <Text style={styles.infoText}>Ciudad: asdasda</Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={() => {}}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#fff'
  },
  header: { 
    alignItems: 'center', 
    marginVertical: 24,
    paddingHorizontal: 16
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#3498DB',
  },
  profileImage: { 
    width: '100%', 
    height: '100%' 
  },
  name: { 
    fontSize: 24, 
    marginBottom: 4, 
    fontWeight: 'bold',
    fontFamily: 'Lufga',
  },
  email: { 
    fontSize: 16, 
    opacity: 0.7, 
    marginBottom: 16,
    fontFamily: 'Lufga',
  },
  section: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
    color: '#2C3E50',
    fontWeight: 'bold',
    fontFamily: 'Lufga',
  },
  infoText: {
    fontSize: 16,
    color: '#34495E',
    marginBottom: 6,
    fontFamily: 'Lufga',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 'auto',
    marginBottom: 24
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Lufga',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 4,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
  },
});