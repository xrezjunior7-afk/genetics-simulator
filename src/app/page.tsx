'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Dna, 
  Leaf, 
  Bug, 
  Rabbit, 
  Wheat,
  ArrowRight, 
  BookOpen, 
  Trophy,
  ChevronRight,
  RotateCcw,
  Sparkles,
  GraduationCap,
  Target,
  Lightbulb
} from 'lucide-react'
import { MonohybridModule, DihybridModule } from '@/components'

interface ProjectData {
  subjects: Subject[]
  tutorials: {
    monohybrid: Tutorial
    dihybrid: Tutorial
  }
  achievements: Achievement[]
}

interface Subject {
  id: string
  name: string
  description: string
  baseImage: string
  traits: Trait[]
}

interface Trait {
  name: string
  defaultSymbols: { dominant: string; recessive: string }
  options: PhenotypeOption[]
}

interface PhenotypeOption {
  phenotype: string
  image: string
  description: string
}

interface Tutorial {
  title: string
  description: string
  steps: string[]
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
}

const iconMap: Record<string, React.ElementType> = {
  'microscope': Target,
  'dna': Dna,
  'chromosome': Sparkles,
  'family-tree': GraduationCap,
  'crystal-ball': Lightbulb
}

export default function MendelGame() {
  const [data, setData] = useState<ProjectData | null>(null)
  const [currentView, setCurrentView] = useState<'menu' | 'monohybrid' | 'dihybrid'>('menu')
  const [stats, setStats] = useState({
    monohybridCount: 0,
    dihybridCount: 0,
    highestGeneration: 0
  })

  useEffect(() => {
    fetch('/data.json')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(e => console.error('Failed to load data:', e))
  }, [])

  const handleCrossComplete = useCallback((type: 'monohybrid' | 'dihybrid', generation: number) => {
    setStats(prev => ({
      ...prev,
      [type === 'monohybrid' ? 'monohybridCount' : 'dihybridCount']: prev[type === 'monohybrid' ? 'monohybridCount' : 'dihybridCount'] + 1,
      highestGeneration: Math.max(prev.highestGeneration, generation)
    }))
  }, [])

  const getOrganismIcon = (id: string) => {
    switch (id) {
      case 'pea-plant': return Leaf
      case 'guinea-pig': return Rabbit
      case 'fruit-fly': return Bug
      case 'corn-plant': return Wheat
      default: return Dna
    }
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <motion.div 
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Dna className="w-16 h-16 text-emerald-600" />
          </motion.div>
          <p className="text-lg text-emerald-700 font-medium">Memuat data genetika...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex flex-col">
      <AnimatePresence mode="wait">
        {currentView === 'menu' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* Header */}
            <header className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-lg">
              <div className="max-w-7xl mx-auto px-4 py-6">
                <motion.div 
                  className="flex items-center justify-between"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      whileHover={{ rotate: 180 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Dna className="w-10 h-10" />
                    </motion.div>
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold">Lab Genetika Mendel</h1>
                      <p className="text-emerald-100 text-sm md:text-base">Simulasi Interaktif Hukum Hereditas</p>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-4">
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30 px-3 py-1">
                      <Trophy className="w-4 h-4 mr-1" /> {stats.monohybridCount + stats.dihybridCount} Eksperimen
                    </Badge>
                  </div>
                </motion.div>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto px-4 py-8">
              {/* Welcome Section */}
              <motion.div 
                className="text-center mb-10"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                  Selamat Datang, Peneliti! 👨‍🔬
                </h2>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                  Pelajari hukum pewarisan sifat Gregor Mendel melalui simulasi persilangan interaktif. 
                  Pilih jenis percobaan dan mulai petualangan genetikamu!
                </p>
              </motion.div>

              {/* Mode Selection Cards */}
              <div className="grid md:grid-cols-2 gap-6 mb-10">
                {/* Monohybrid Card */}
                <motion.div
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="cursor-pointer"
                  onClick={() => setCurrentView('monohybrid')}
                >
                  <Card className="h-full border-2 border-emerald-200 hover:border-emerald-400 transition-all duration-300 bg-gradient-to-br from-white to-emerald-50 shadow-lg hover:shadow-xl">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-emerald-100 rounded-xl">
                            <Dna className="w-8 h-8 text-emerald-600" />
                          </div>
                          <div>
                            <CardTitle className="text-xl text-emerald-800">Monohybrid</CardTitle>
                            <CardDescription>Hukum Mendel I - Segregasi</CardDescription>
                          </div>
                        </div>
                        <ArrowRight className="w-6 h-6 text-emerald-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">
                        Pelajari pewarisan satu sifat dengan tabel Punnett 2×2. 
                        Amati bagaimana alel dominan dan resesif memisah saat pembentukan gamet.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="border-emerald-300 text-emerald-700">1 Trait</Badge>
                        <Badge variant="outline" className="border-emerald-300 text-emerald-700">Punnett 2×2</Badge>
                        <Badge variant="outline" className="border-emerald-300 text-emerald-700">Rasio 3:1</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Dihybrid Card */}
                <motion.div
                  initial={{ x: 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="cursor-pointer"
                  onClick={() => setCurrentView('dihybrid')}
                >
                  <Card className="h-full border-2 border-teal-200 hover:border-teal-400 transition-all duration-300 bg-gradient-to-br from-white to-teal-50 shadow-lg hover:shadow-xl">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-teal-100 rounded-xl">
                            <Sparkles className="w-8 h-8 text-teal-600" />
                          </div>
                          <div>
                            <CardTitle className="text-xl text-teal-800">Dihybrid</CardTitle>
                            <CardDescription>Hukum Mendel II - Pengelompokan Bebas</CardDescription>
                          </div>
                        </div>
                        <ArrowRight className="w-6 h-6 text-teal-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">
                        Jelajahi pewarisan dua sifat sekaligus dengan tabel Punnett 4×4. 
                        Pahami konsep pengelompokan bebas alel dari gen yang berbeda.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="border-teal-300 text-teal-700">2 Traits</Badge>
                        <Badge variant="outline" className="border-teal-300 text-teal-700">Punnett 4×4</Badge>
                        <Badge variant="outline" className="border-teal-300 text-teal-700">Rasio 9:3:3:1</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Tutorial Section */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="bg-white/80 backdrop-blur shadow-lg">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-emerald-600" />
                      <CardTitle className="text-lg">Panduan Pembelajaran</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="monohybrid">
                      <TabsList className="grid w-full grid-cols-2 max-w-md">
                        <TabsTrigger value="monohybrid">Monohybrid</TabsTrigger>
                        <TabsTrigger value="dihybrid">Dihybrid</TabsTrigger>
                      </TabsList>
                      <TabsContent value="monohybrid" className="mt-4">
                        <div className="space-y-4">
                          <p className="text-gray-600">{data.tutorials.monohybrid.description}</p>
                          <ol className="space-y-2">
                            {data.tutorials.monohybrid.steps.map((step, i) => (
                              <motion.li 
                                key={i}
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.7 + i * 0.1 }}
                                className="flex items-start gap-2"
                              >
                                <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-medium">
                                  {i + 1}
                                </span>
                                <span className="text-gray-700">{step}</span>
                              </motion.li>
                            ))}
                          </ol>
                        </div>
                      </TabsContent>
                      <TabsContent value="dihybrid" className="mt-4">
                        <div className="space-y-4">
                          <p className="text-gray-600">{data.tutorials.dihybrid.description}</p>
                          <ol className="space-y-2">
                            {data.tutorials.dihybrid.steps.map((step, i) => (
                              <motion.li 
                                key={i}
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.7 + i * 0.1 }}
                                className="flex items-start gap-2"
                              >
                                <span className="flex-shrink-0 w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-sm font-medium">
                                  {i + 1}
                                </span>
                                <span className="text-gray-700">{step}</span>
                              </motion.li>
                            ))}
                          </ol>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Organisms Preview */}
              <motion.div
                className="mt-8"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-emerald-600" />
                  Organisme yang Tersedia
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {data.subjects.map((subject, i) => {
                    const Icon = getOrganismIcon(subject.id)
                    return (
                      <motion.div
                        key={subject.id}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.9 + i * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <Card className="bg-white/80 backdrop-blur text-center p-4">
                          <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                            <Icon className="w-8 h-8 text-emerald-600" />
                          </div>
                          <p className="font-medium text-gray-800 text-sm">{subject.name.split('(')[0].trim()}</p>
                          <p className="text-xs text-gray-500">{subject.traits.length} sifat</p>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>

              {/* Achievements */}
              <motion.div
                className="mt-8"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Pencapaian
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {data.achievements.map((achievement, i) => {
                    const Icon = iconMap[achievement.icon] || Target
                    const isUnlocked = 
                      (achievement.id === 'first-cross' && (stats.monohybridCount + stats.dihybridCount) >= 1) ||
                      (achievement.id === 'monohybrid-master' && stats.monohybridCount >= 5) ||
                      (achievement.id === 'dihybrid-master' && stats.dihybridCount >= 5) ||
                      (achievement.id === 'generation-3' && stats.highestGeneration >= 3)
                    
                    return (
                      <motion.div
                        key={achievement.id}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 1.1 + i * 0.05 }}
                      >
                        <Card className={`text-center p-3 transition-all duration-300 ${
                          isUnlocked 
                            ? 'bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-300' 
                            : 'bg-gray-100 border-gray-200 opacity-60'
                        }`}>
                          <div className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${
                            isUnlocked ? 'bg-amber-200' : 'bg-gray-200'
                          }`}>
                            <Icon className={`w-5 h-5 ${isUnlocked ? 'text-amber-700' : 'text-gray-400'}`} />
                          </div>
                          <p className="font-medium text-sm text-gray-800">{achievement.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{achievement.description}</p>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            </main>

            {/* Footer */}
            <footer className="bg-gray-800 text-white py-4 mt-auto">
              <div className="max-w-7xl mx-auto px-4 text-center">
                <p className="text-sm text-gray-400">
                  Lab Genetika Mendel © 2024 — Simulasi Edukatif Hukum Hereditas
                </p>
              </div>
            </footer>
          </motion.div>
        )}

        {currentView === 'monohybrid' && (
          <motion.div
            key="monohybrid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1"
          >
            <MonohybridModule 
              data={data} 
              onBack={() => setCurrentView('menu')}
              onCrossComplete={(gen) => handleCrossComplete('monohybrid', gen)}
            />
          </motion.div>
        )}

        {currentView === 'dihybrid' && (
          <motion.div
            key="dihybrid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1"
          >
            <DihybridModule 
              data={data} 
              onBack={() => setCurrentView('menu')}
              onCrossComplete={(gen) => handleCrossComplete('dihybrid', gen)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
